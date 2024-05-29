package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

const (
	b2Endpoint = "https://s3.us-east-005.backblazeb2.com"
	bucketName = "zettelgarden-files-dev"
)

func createS3Client() *s3.Client {

	accessKeyID := os.Getenv("B2_ACCESS_KEY_ID")
	secretAccessKey := os.Getenv("B2_SECRET_ACCESS_KEY")

	if accessKeyID == "" || secretAccessKey == "" {
		log.Fatal("B2_ACCESS_KEY_ID and B2_SECRET_ACCESS_KEY must be set")
	}

	// Create an AWS Config with the B2 credentials and S3 endpoint
	cfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion("us-east-005"), // Replace with your region
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKeyID, secretAccessKey, "")),
		config.WithEndpointResolver(aws.EndpointResolverFunc(func(service, region string) (aws.Endpoint, error) {
			if service == s3.ServiceID {
				return aws.Endpoint{
					URL: b2Endpoint,
				}, nil
			}
			return aws.Endpoint{}, fmt.Errorf("unknown endpoint requested")
		})),
	)
	if err != nil {
		log.Fatalf("unable to load SDK config, %v", err)
	}

	// Create an S3 client
	client := s3.NewFromConfig(cfg)
	return client
}

func listObjects(client *s3.Client) {
	// List the objects in the bucket
	resp, err := client.ListObjectsV2(context.TODO(), &s3.ListObjectsV2Input{
		Bucket: aws.String(bucketName),
	})
	if err != nil {
		log.Fatalf("unable to list items in bucket %q, %v", bucketName, err)
	}

	for _, item := range resp.Contents {
		fmt.Printf("Name: %s, Size: %d\n", *item.Key, item.Size)
	}
}
func uploadObject(client *s3.Client, key, filePath string) {
	file, err := os.Open(filePath)
	if err != nil {
		log.Fatalf("unable to open file %q, %v", filePath, err)
	}
	defer file.Close()

	_, err = client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(key),
		Body:   file,
	})
	if err != nil {
		log.Fatalf("unable to upload %q to %q, %v", filePath, bucketName, err)
	}
}

func downloadObject(client *s3.Client, key, filePath string) (*s3.GetObjectOutput, error) {
	result, err := client.GetObject(context.TODO(), &s3.GetObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, fmt.Errorf("unable to receive file")
	}
	return result, err

	// file, err := os.Create(filePath)
	// if err != nil {
	// 	log.Fatalf("unable to create file %q, %v", filePath, err)
	// }
	// defer file.Close()

	// _, err = io.Copy(file, resp.Body)
	// if err != nil {
	// 	log.Fatalf("unable to copy data to file %q, %v", filePath, err)
	// }

	// fmt.Printf("Successfully downloaded %q to %q\n", key, filePath)
}
func deleteObject(client *s3.Client, key string) {
	_, err := client.DeleteObject(context.TODO(), &s3.DeleteObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(key),
	})
	if err != nil {
		log.Fatalf("unable to delete item %q, %v", key, err)
	}

	fmt.Printf("Successfully deleted %q from %q\n", key, bucketName)
}
