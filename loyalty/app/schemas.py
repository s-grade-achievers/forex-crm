from pydantic import BaseModel


class WalletOut(BaseModel):
    user_id: int
    points: int

    class Config:
        orm_mode = True


class RedeemResponse(BaseModel):
    user_id: int
    redeemed: int
    money: float


class VoucherResponse(BaseModel):
    user_id: int
    voucher_code: str
