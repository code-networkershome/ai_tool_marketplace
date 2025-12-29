"""
Web scraper service for extracting content from tool websites.
Supports both static HTML and JavaScript-rendered pages.
"""
import asyncio
import httpx
from typing import Optional, Dict, Any
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
import re
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class WebScraper:
    """Web scraper with support for static and dynamic content."""

    def __init__(self):
        self.timeout = settings.SCRAPER_TIMEOUT
        self.max_retries = settings.SCRAPER_MAX_RETRIES
        self.user_agent = settings.SCRAPER_USER_AGENT
        self.headers = {
            "User-Agent": self.user_agent,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate",
            "Connection": "keep-alive",
        }

    async def fetch_static(self, url: str) -> Optional[str]:
        """Fetch HTML using httpx (for static sites)."""
        for attempt in range(self.max_retries):
            try:
                async with httpx.AsyncClient(
                    timeout=self.timeout,
                    follow_redirects=True
                ) as client:
                    response = await client.get(url, headers=self.headers)
                    response.raise_for_status()
                    return response.text
            except httpx.HTTPError as e:
                logger.warning(f"Attempt {attempt + 1} failed for {url}: {e}")
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                continue
        return None

    async def fetch_dynamic(self, url: str) -> Optional[str]:
        """Fetch HTML using Playwright (for JS-rendered sites)."""
        if not settings.PLAYWRIGHT_ENABLED:
            return await self.fetch_static(url)

        try:
            from playwright.async_api import async_playwright

            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent=self.user_agent,
                    viewport={"width": 1920, "height": 1080}
                )
                page = await context.new_page()

                await page.goto(url, wait_until="networkidle", timeout=self.timeout * 1000)
                await page.wait_for_timeout(2000)  # Extra wait for dynamic content

                html = await page.content()
                await browser.close()
                return html

        except Exception as e:
            logger.error(f"Playwright fetch failed for {url}: {e}")
            return await self.fetch_static(url)

    async def fetch(self, url: str, use_playwright: bool = False) -> Optional[str]:
        """Fetch URL content."""
        if use_playwright:
            return await self.fetch_dynamic(url)
        return await self.fetch_static(url)

    def clean_html(self, html: str) -> Dict[str, Any]:
        """
        Clean HTML and extract meaningful content.
        Removes boilerplate (nav, footer, ads, etc.)
        """
        soup = BeautifulSoup(html, "lxml")

        # Remove unwanted elements
        for element in soup.find_all([
            "script", "style", "nav", "footer", "header",
            "aside", "iframe", "noscript", "form"
        ]):
            element.decompose()

        # Remove common ad/tracking divs
        for div in soup.find_all(["div", "section"], class_=re.compile(
            r"(ad|ads|advertisement|tracking|analytics|cookie|banner|popup|modal|sidebar)",
            re.I
        )):
            div.decompose()

        # Extract metadata
        metadata = self._extract_metadata(soup)

        # Extract main content
        main_content = self._extract_main_content(soup)

        # Extract structured data
        structured_data = self._extract_structured_data(soup)

        return {
            "metadata": metadata,
            "main_content": main_content,
            "structured_data": structured_data,
            "raw_text": soup.get_text(separator="\n", strip=True)[:15000],
        }

    def _extract_metadata(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract page metadata."""
        metadata = {}

        # Title
        if soup.title:
            metadata["title"] = soup.title.string.strip() if soup.title.string else ""

        # Meta tags
        for meta in soup.find_all("meta"):
            name = meta.get("name", meta.get("property", "")).lower()
            content = meta.get("content", "")

            if name in ["description", "og:description", "twitter:description"]:
                metadata.setdefault("description", content)
            elif name in ["og:title", "twitter:title"]:
                metadata.setdefault("og_title", content)
            elif name in ["og:image", "twitter:image"]:
                metadata.setdefault("og_image", content)
            elif name == "keywords":
                metadata["keywords"] = [k.strip() for k in content.split(",")]

        # Favicon / Logo
        for link in soup.find_all("link", rel=re.compile(r"(icon|apple-touch-icon)", re.I)):
            metadata.setdefault("favicon", link.get("href"))
            break

        return metadata

    def _extract_main_content(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract main page content."""
        content = {}

        # Try to find main content area
        main = soup.find("main") or soup.find("article") or soup.find(id="content")
        if not main:
            main = soup.find("body")

        if main:
            # Extract headings
            headings = []
            for h in main.find_all(["h1", "h2", "h3"]):
                text = h.get_text(strip=True)
                if text:
                    headings.append({"level": h.name, "text": text})
            content["headings"] = headings[:20]

            # Extract paragraphs
            paragraphs = []
            for p in main.find_all("p"):
                text = p.get_text(strip=True)
                if len(text) > 50:  # Filter short paragraphs
                    paragraphs.append(text)
            content["paragraphs"] = paragraphs[:30]

            # Extract lists (often feature lists)
            lists = []
            for ul in main.find_all(["ul", "ol"]):
                items = [li.get_text(strip=True) for li in ul.find_all("li")]
                if 3 <= len(items) <= 20:  # Reasonable feature list
                    lists.append(items)
            content["lists"] = lists[:10]

        # Extract links
        links = {}
        for a in soup.find_all("a", href=True):
            href = a.get("href", "").lower()
            text = a.get_text(strip=True).lower()

            if "github" in href:
                links["github"] = a["href"]
            elif "twitter" in href or "x.com" in href:
                links["twitter"] = a["href"]
            elif "linkedin" in href:
                links["linkedin"] = a["href"]
            elif "discord" in href:
                links["discord"] = a["href"]
            elif "docs" in href or "documentation" in text:
                links["docs"] = a["href"]
            elif "demo" in href or "demo" in text:
                links["demo"] = a["href"]

        content["links"] = links

        # Extract pricing info
        pricing_section = soup.find(id=re.compile(r"pricing", re.I)) or \
                         soup.find(class_=re.compile(r"pricing", re.I))
        if pricing_section:
            content["pricing_text"] = pricing_section.get_text(separator="\n", strip=True)[:2000]

        return content

    def _extract_structured_data(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract JSON-LD and other structured data."""
        structured = {}

        for script in soup.find_all("script", type="application/ld+json"):
            try:
                import json
                data = json.loads(script.string)
                if isinstance(data, dict):
                    schema_type = data.get("@type", "")
                    if schema_type in ["SoftwareApplication", "WebApplication", "Product"]:
                        structured["schema"] = data
                        break
            except (json.JSONDecodeError, TypeError):
                continue

        return structured


# Singleton instance
scraper = WebScraper()
