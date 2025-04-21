FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN npm install axios react-router-dom --save

COPY . .

ENV REACT_APP_API_URL=http://backend:4000
ENV REACT_APP_DUMMY_API_URL=http://localhost:3001
ENV REACT_APP_MASTER_URL=http://localhost:5000
ENV PORT=3001

RUN npm run build

RUN npm install -g serve

EXPOSE 3001

CMD ["serve", "-s", "build", "-l", "3001"]