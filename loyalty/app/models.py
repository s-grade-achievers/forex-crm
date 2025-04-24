from sqlalchemy import Column, Integer, String
from app.database import Base


class Wallet(Base):
    __tablename__ = "wallets"

    user_id = Column(Integer, primary_key=True, index=True)
    points = Column(Integer, default=0)
