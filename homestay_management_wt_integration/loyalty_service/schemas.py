from pydantic import BaseModel

class WalletBase(BaseModel):
    user_id: int
    points: int

class WalletSchema(WalletBase):
    class Config:
        orm_mode = True

class RedeemSchema(BaseModel):
    user_id: int
    redeemed: int
    money: float

    class Config:
        orm_mode = True

class VoucherSchema(BaseModel):
    user_id: int
    voucher_code: str

    class Config:
        orm_mode = True
