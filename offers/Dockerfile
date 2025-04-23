FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install httpx

COPY . .

EXPOSE 8000
RUN python migrate_wallet_db.py
CMD ["uvicorn main:app --host 0.0.0.0 --port 8000"]
