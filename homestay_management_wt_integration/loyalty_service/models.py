from sqlalchemy import Column, Integer
from database import Base

class Wallet(Base):
    __tablename__ = "wallets"
    user_id = Column(Integer, primary_key=True, index=True)
    points = Column(Integer, default=0)