FROM node:20-alpine
WORKDIR /app

# Copy package files and install all dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy everything
COPY . .

# Expose the app port
EXPOSE 5173

# Wait for external command (e.g. docker run ... npm run dev)
CMD ["sh"]
