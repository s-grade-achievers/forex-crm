FROM node:18-alpine

WORKDIR /app
RUN npm init -y
RUN npm install express cors dotenv https jsonwebtoken pg 
RUN apk add openssl
COPY . /app
CMD sh -c "openssl req -nodes -new -x509 -keyout src/server.key -out src/server.cert -days 365 -subj '/CN=localhost' && node src/server.js"