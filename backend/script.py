import psycopg2
import boto3
import os

# PostgreSQL connection details
pg_host = os.getenv("DB_HOST")
pg_database = os.getenv("DB_NAME")
pg_user = os.getenv("DB_USER")
pg_password = os.getenv("DB_PASS")

# S3 connection details
b2_key_id = os.getenv("B2_ACCESS_KEY_ID")
b2_application_key = os.getenv("B2_SECRET_ACCESS_KEY")
b2_endpoint_url = "https://s3.us-east-005.backblazeb2.com"  # Example endpoint URL, update as necessary
b2_bucket_name = "zettelgarden-files"

def upload_to_b2(file_path, bucket_name, object_name):
    s3_client = boto3.client(
        's3',
        endpoint_url=b2_endpoint_url,
        aws_access_key_id=b2_key_id,
        aws_secret_access_key=b2_application_key
    )
    try:
        s3_client.upload_file(file_path, bucket_name, object_name)
        print(f"File {file_path} uploaded to {bucket_name}/{object_name}")
    except Exception as e:
        print(f"Failed to upload {file_path} to Backblaze B2: {str(e)}")

def main():
    # Connect to PostgreSQL database
    conn = psycopg2.connect(
        host=pg_host,
        database=pg_database,
        user=pg_user,
        password=pg_password
    )
    cursor = conn.cursor()

    # Fetch filenames from the files table
    cursor.execute("SELECT filename FROM files")
    files = cursor.fetchall()

    # Process each file
    for file in files:
        filename = "/media/harmonia/.config/zettelkasten/" + file[0]
        if os.path.isfile(filename):
            upload_to_b2(filename, b2_bucket_name, os.path.basename(filename))
        else:
            print(f"File {filename} does not exist")
        print(filename)

    # Close the PostgreSQL connection
    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
