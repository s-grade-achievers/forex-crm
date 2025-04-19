# Frontend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Add react-router-dom and axios (if not in package.json already)
RUN npm install axios react-router-dom --save

# Copy rest of the app code
COPY . .

# Set environment variables
ENV REACT_APP_API_URL=http://backend:4000
ENV REACT_APP_DUMMY_API_URL=http://localhost:3001
ENV REACT_APP_MASTER_URL=http://localhost:5000
ENV PORT=3001

# Build the React app
RUN npm run build

# Install serve to serve static files
RUN npm install -g serve

# Expose the port
EXPOSE 3001

# Serve the build folder
CMD ["serve", "-s", "build", "-l", "3001"]