FROM node:18-alpine

WORKDIR /app
RUN npm init -y
RUN npm install express cors dotenv https jsonwebtoken pg axios
COPY . /app
CMD ["node", "src/server.js"]