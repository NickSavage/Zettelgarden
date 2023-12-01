# Dockerfile-backend

# Use an official Python runtime as a parent image
FROM python:3.11


RUN apt-get update \
    && apt-get -y install libpq-dev gcc \
        && pip install psycopg2

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the current directory contents into the container at /usr/src/app
COPY . .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Make port 5001 available to the world outside this container
EXPOSE 5000

# Run app.py when the container launches
CMD ["gunicorn", "-w 4", "app:app", "-b 0.0.0.0:5000", "--log-level", "debug", "--capture-output", "--access-logfile", "/var/log/zettelkasten.access.log", "--error-logfile", "/var/log/zettelkasten.error.log"]