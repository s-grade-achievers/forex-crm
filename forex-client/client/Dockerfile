# Frontend Dockerfile
# Place this file in the /client directory
FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install
RUN npm install axios react-router-dom --save

# Copy the rest of the frontend code
COPY . .

# Create a .env file for environment variables
RUN echo "REACT_APP_API_URL=http://localhost:4000" > .env
RUN echo "REACT_APP_DUMMY_API_URL=http://localhost:3001" >> .env 
RUN echo "REACT_APP_MASTER_URL=http://localhost:5000" >> .env

ENV PORT=3001
# Expose the port the app runs on
EXPOSE 3001

# Command to run the app
CMD ["npm", "start"]