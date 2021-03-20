# Simple REST API deployed on AWS Fargate using blue/green deployment

This is a code repository for the very simple CRUD REST API with Node.js and Express. API is packaged as Docker container and deployed on AWS using AWS Fargate and Blue/Green deployment

## How to run

Just `npm start` and point your browser to `url http://localhost:80/user`

Alternatively, you can build the docker image and run it:

```
docker build -t users-api .
docker run -it -p 80:80 --rm users-api:latest
```

### Health status

`curl http://localhost:80/health`

### Supported operations

- get all: `curl http://localhost:80/user`

- read: `curl http://localhost:80/user/<USER-ID>`

- create: `curl -d '{ "username":"Joe", "age": 30 }' -H "Content-Type: application/json" -X POST http://localhost:80/user`

- delete: `curl -X DELETE http://localhost:80/user/<USER-ID>`

- update: `curl -d '{ "username":"Jane", "age": 25 }' -H "Content-Type: application/json" -X PATCH http://localhost:80/user/<USER-ID>`

## Deploy to AWS

### Prerequisite

Before you start, please change GithubUserName default value in `cicd/pipeline.yaml`

### Steps

1. First you need to provide access from GitHub to AWS via AccessToken. Please refer to [the github documentation] (https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token).

2. Now that you have an access token from GitHub, you need to store it in AWS SSM Parameter Store. Login to your AWS Account (AWS Console) and navigate to Systems Manager (SSM) and click on Parameter Store. Create a parameter with the name `/github/token` and as value use the access token from github.

3. Navigate to Cloudformation and create a new stack. Upload the template (cicd/pipeline.yaml) and give it some name. I prefer adding `pipeline` suffix e.g. `user-service-pipeline`. Make sure you allow the Cloudformation to create the IAM Role on your behalf!

4. Hit the "Create Stack". This will create the stack with the codepipeline which will build the service and create another AWS Stack using `infrastructure/cf-template.yaml`.

## Test your Deployment

After the CodePipeline has finished, Fargate Cluster should be up and running now.

1. Go to EC2 Service -> Load Balancers and find the DNS address

2. Using DNS address you just obtained run:

```
curl http://<DNS_FROM_PRREVIOUS_STEP>/user
```
