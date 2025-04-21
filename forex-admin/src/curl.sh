openssl req -nodes -new -x509 -keyout server.key -out server.cert -days 365

curl -X GET --cacert server.cert https://localhost:3000/api/fetchPairs

curl -X PUT --cacert server.cert https://localhost:3000/api/updateExchangeRate

curl -X POST https://localhost:3000/api/buyCurrency \
-H "Content-Type: application/json" \
-H "Authorization: Bearer <jwt>" \
--cacert server.cert \
-d '{"hi":"hello"}'
