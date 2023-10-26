# Dockerfile-frontend

ARG REACT_APP_URL
ENV REACT_APP_URL=$REACT_APP_URL

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

# Build the app
RUN npm run build

# Use serve to serve the build folder
RUN npm install -g serve

# Make port 5000 available to the world outside this container
EXPOSE 3000

# Run serve when the container launches
CMD ["serve", "-s", "build"]
