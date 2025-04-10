FROM node:18-alpine
WORKDIR /app
RUN npm init -y
RUN npm install mssql express cors dotenv
CMD ["node", "src/server.js"]   