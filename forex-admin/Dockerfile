FROM node:18-alpine

WORKDIR /app
RUN npm init -y
RUN npm install express cors dotenv https jsonwebtoken pg axios
COPY . /app
RUN echo "cac85623ad9891172dc0be96" > ./src/secret.txt
CMD ["node", "src/server.js"]
