# Using node.js for lightweight frontend
FROM node:22-alpine

WORKDIR /app

# Install Node.js library
COPY package*.json ./
RUN npm install

# Copy all frontend code
COPY . .

# Open Vite port
EXPOSE 5173

# Open frontend and force open access to external network (--host)
CMD ["npm", "run", "dev", "--", "--host"]