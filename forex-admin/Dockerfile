FROM node:18-alpine

WORKDIR /app
RUN npm init -y
RUN npm install express cors dotenv https jsonwebtoken pg axios
COPY . /app
RUN echo "hi" > ./src/secret.txt
RUN cat ./src/secret.txt
CMD ["node", "src/server.js"]