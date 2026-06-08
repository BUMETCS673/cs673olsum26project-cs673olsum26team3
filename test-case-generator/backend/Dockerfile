# Use the official Node.js runtime environment base image
FROM node:20-alpine

# Set the working directory inside the container mapping structure
WORKDIR /app

# Copy dependency manifests first to leverage Docker build cache layers
COPY package*.json ./

# Install application dependencies inside the workspace environment
RUN npm install

# Copy all remaining local backend codebase into the container destination
COPY . .

# Expose the designated service port for gateway traffic
EXPOSE 5001

# Execute the entrypoint pointing directly to the src folder layout
CMD ["node", "src/server.js"]