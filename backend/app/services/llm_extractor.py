"""
LLM-powered data extraction and structuring service.
Uses OpenAI GPT models to extract and classify tool information.
"""
import json
import logging
from typing import Dict, Any, Optional, List
from openai import AsyncOpenAI

from app.core.config import settings
from app.schemas.tool import ToolExtractionResult

logger = logging.getLogger(__name__)


EXTRACTION_PROMPT = """You are an AI tool data extraction specialist. Analyze the following website content and extract structured information about the AI/software tool.

WEBSITE URL: {url}

EXTRACTED CONTENT:
---
Title: {title}
Description: {description}
Main Content: {main_content}
Pricing Text: {pricing_text}
Links: {links}
---

Extract and return a JSON object with the following fields:

{{
    "name": "Official tool name",
    "short_description": "A compelling 1-2 sentence description (max 500 chars)",
    "long_description": "Detailed description of what the tool does (2-3 paragraphs)",
    "category": "Primary category (choose from: AI Writing, AI Image Generation, AI Video, AI Audio, AI Coding, AI Chatbots, AI Productivity, AI Marketing, AI Design, AI Data Analysis, AI Research, AI Education, AI Customer Service, AI HR, AI Finance, AI Healthcare, AI Legal, Developer Tools, Automation, Other)",
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
    "pricing_model": "free | freemium | paid | subscription | usage_based | contact | open_source",
    "pricing_details": "Brief pricing explanation if available",
    "features": ["feature1", "feature2", "feature3"],
    "use_cases": ["use case 1", "use case 2", "use case 3"],
    "target_audience": "Who this tool is for",
    "github_url": "GitHub URL if found, otherwise null",
    "twitter_url": "Twitter/X URL if found, otherwise null",
    "logo_url": "Logo/icon URL if found, otherwise null"
}}

IMPORTANT:
- Be accurate and factual based on the content provided
- Write compelling but truthful descriptions
- Choose the most specific category that fits
- Select relevant, searchable tags
- If information is not available, use null or empty values
- Do not make up features or capabilities not mentioned in the content

Return ONLY the JSON object, no additional text."""


CATEGORY_CLASSIFICATION_PROMPT = """Given the following tool information, classify it into the most appropriate category.

Tool Name: {name}
Description: {description}
Tags: {tags}

Available Categories:
1. AI Writing - Text generation, copywriting, content creation
2. AI Image Generation - Image creation, editing, enhancement
3. AI Video - Video generation, editing, enhancement
4. AI Audio - Music, voice, speech tools
5. AI Coding - Code generation, debugging, development
6. AI Chatbots - Conversational AI, chat interfaces
7. AI Productivity - Task automation, scheduling, organization
8. AI Marketing - Marketing automation, analytics, campaigns
9. AI Design - UI/UX design, graphic design tools
10. AI Data Analysis - Data processing, visualization, insights
11. AI Research - Academic, scientific research tools
12. AI Education - Learning, tutoring, educational tools
13. AI Customer Service - Support, helpdesk, CRM
14. AI HR - Recruiting, HR management tools
15. AI Finance - Financial analysis, trading, accounting
16. AI Healthcare - Medical, health-related tools
17. AI Legal - Legal research, contract analysis
18. Developer Tools - APIs, SDKs, dev utilities
19. Automation - Workflow automation, RPA
20. Other - Tools that don't fit other categories

Return only the category name, nothing else."""


class LLMExtractor:
    """LLM-powered tool data extraction service."""

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.LLM_MODEL

    async def extract_tool_data(
        self,
        url: str,
        scraped_content: Dict[str, Any]
    ) -> Optional[ToolExtractionResult]:
        """
        Extract structured tool data from scraped content using LLM.
        """
        try:
            # Prepare content for prompt
            metadata = scraped_content.get("metadata", {})
            main_content = scraped_content.get("main_content", {})

            title = metadata.get("title", "") or metadata.get("og_title", "")
            description = metadata.get("description", "")

            # Combine paragraphs and headings
            content_text = ""
            for heading in main_content.get("headings", [])[:10]:
                content_text += f"## {heading['text']}\n"
            for para in main_content.get("paragraphs", [])[:15]:
                content_text += f"{para}\n\n"

            # Format links
            links_str = json.dumps(main_content.get("links", {}))

            # Pricing text
            pricing_text = main_content.get("pricing_text", "Not available")

            # Build prompt
            prompt = EXTRACTION_PROMPT.format(
                url=url,
                title=title,
                description=description,
                main_content=content_text[:8000],
                pricing_text=pricing_text[:2000],
                links=links_str
            )

            # Call LLM
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a precise data extraction assistant."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=2000,
                response_format={"type": "json_object"}
            )

            # Parse response
            result_text = response.choices[0].message.content
            result_data = json.loads(result_text)

            # Validate and normalize
            return ToolExtractionResult(
                name=result_data.get("name", "Unknown Tool"),
                short_description=result_data.get("short_description", "")[:500],
                long_description=result_data.get("long_description"),
                category=result_data.get("category", "Other"),
                tags=result_data.get("tags", [])[:10],
                pricing_model=self._normalize_pricing(result_data.get("pricing_model")),
                pricing_details=result_data.get("pricing_details"),
                logo_url=result_data.get("logo_url") or metadata.get("og_image"),
                github_url=result_data.get("github_url"),
                twitter_url=result_data.get("twitter_url"),
                features=result_data.get("features", [])[:15],
                use_cases=result_data.get("use_cases", [])[:10],
                raw_data=scraped_content
            )

        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {e}")
            return None
        except Exception as e:
            logger.error(f"LLM extraction error: {e}")
            return None

    async def classify_category(
        self,
        name: str,
        description: str,
        tags: List[str]
    ) -> str:
        """Classify tool into a category using LLM."""
        try:
            prompt = CATEGORY_CLASSIFICATION_PROMPT.format(
                name=name,
                description=description,
                tags=", ".join(tags)
            )

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
                max_tokens=50
            )

            category = response.choices[0].message.content.strip()
            return category if category else "Other"

        except Exception as e:
            logger.error(f"Category classification error: {e}")
            return "Other"

    async def generate_tags(
        self,
        name: str,
        description: str,
        existing_tags: List[str]
    ) -> List[str]:
        """Generate additional relevant tags."""
        try:
            prompt = f"""Generate 5 relevant search tags for this AI tool.

Tool: {name}
Description: {description}
Existing tags: {', '.join(existing_tags)}

Return only comma-separated tags, no explanations.
Focus on: use cases, technologies, industries, features."""

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=100
            )

            new_tags = [
                tag.strip().lower()
                for tag in response.choices[0].message.content.split(",")
            ]
            # Combine and dedupe
            all_tags = list(set(existing_tags + new_tags))
            return all_tags[:10]

        except Exception as e:
            logger.error(f"Tag generation error: {e}")
            return existing_tags

    def _normalize_pricing(self, pricing: str) -> str:
        """Normalize pricing model string."""
        pricing = (pricing or "").lower().strip()
        valid_models = {
            "free": "free",
            "freemium": "freemium",
            "paid": "paid",
            "subscription": "subscription",
            "usage_based": "usage_based",
            "usage-based": "usage_based",
            "contact": "contact",
            "open_source": "open_source",
            "open-source": "open_source",
            "opensource": "open_source",
        }
        return valid_models.get(pricing, "freemium")


# Singleton instance
llm_extractor = LLMExtractor()
