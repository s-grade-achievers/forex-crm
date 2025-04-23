openssl req -nodes -new -x509 -keyout server.key -out server.cert -days 365

curl -X GET --cacert server.cert https://localhost:3000/api/fetchPairs

curl -X PUT --cacert server.cert https://localhost:3000/api/updateExchangeRate

curl -X POST https://localhost:3000/api/buyCurrency \
-H "Content-Type: application/json" \
-H "Authorization: Bearer <jwt>" \
--cacert server.cert \
-d '{"hi":"hello"}'

curl -Xk POST https://api.forex-crm.local/api/bookings \
-H "Content-Type: application/json" \
-d '{
  "user_id": 1,
  "room_id": 101,
  "start_date": "2025-04-25",
  "end_date": "2025-04-30",
  "status": "confirmed",
  "amount": 500
}'

curl -k -X GET "http://api.forex-crm.local/api/offers/offer?user_id=4" \
-H "Content-Type: application/json"

