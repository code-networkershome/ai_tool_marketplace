
import asyncio
import sys
import os

# Add current directory to path so it can find 'app'
sys.path.append(os.getcwd())

from sqlalchemy import select, update
from app.core.database import AsyncSessionLocal
from app.models.user import User, UserRole

async def promote_user(email: str):
    print(f"Connecting to database to promote {email}...")

    # Initialize database connection
    async with AsyncSessionLocal() as db:
        # Find user
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user:
            print(f"Error: User with email '{email}' not found.")
            # List users to help debug
            result = await db.execute(select(User))
            users = result.scalars().all()
            if users:
                print("\nExisting users in database:")
                for u in users:
                    print(f"- {u.email} (Role: {u.role})")
            else:
                print("\nNo users found in database.")
            return

        # Update role
        await db.execute(
            update(User)
            .where(User.email == email)
            .values(role=UserRole.ADMIN)
        )
        await db.commit()
        print(f"Success! User {email} has been promoted to ADMIN.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python promote_admin.py your-email@example.com")
        sys.exit(1)

    email_to_promote = sys.argv[1].strip()
    asyncio.run(promote_user(email_to_promote))
