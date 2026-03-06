# database.py — SQLAlchemy engine and session setup
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Read DB connection string from environment variable
# Format: mysql+pymysql://user:password@host:port/dbname
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://pilot:pilotpass@localhost:3306/pipelinepilot"
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,   # Reconnect on stale connections
    pool_recycle=300,     # Recycle connections every 5 minutes
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all ORM models
Base = declarative_base()


def get_db():
    """Dependency — yields a DB session and closes it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
