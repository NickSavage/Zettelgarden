# Dockerfile-backend

# Use an official Python runtime as a parent image
FROM python:3.11

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the current directory contents into the container at /usr/src/app
COPY . .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Make port 5001 available to the world outside this container
EXPOSE 8081

# Run app.py when the container launches
CMD ["gunicorn", "-w", "4", "app:app", "-b", "0.0.0.0:8081", "--log-level", "debug"]
