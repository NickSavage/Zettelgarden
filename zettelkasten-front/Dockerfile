# Dockerfile-frontend
# Use an official Node runtime as a parent image
FROM node:18

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the current directory contents into the container at /usr/src/app
COPY . .

# Set environment variables and run the build
ARG VITE_URL
ARG VITE_ENV
RUN VITE_URL=${VITE_URL} VITE_ENV=${VITE_ENV} npm run build

# Use serve to serve the build folder
RUN npm install -g serve

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Run serve when the container launches
CMD ["serve", "-s", "dist", "-l", "3000"]
