FROM node:20-alpine
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy app source and build frontend + backend
COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=8080

# Elastic Beanstalk expects the app to listen on 8080
EXPOSE 8080

CMD ["node", "dist/server/index.js"]
