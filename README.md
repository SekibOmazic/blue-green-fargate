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

### From the terminal

Put the name of you github repo:

```
SERVICE_NAME=<GITHUB_REPO_NAME>
```

And then create the pipeline stack:

```
aws cloudformation create-stack --stack-name ${SERVICE_NAME}-pipeline \
    --template-body file://$PWD/cloudformation/cicd/pipeline.yaml \
    --parameters ParameterKey=ServiceName,ParameterValue=${SERVICE_NAME} \
                 ParameterKey=GithubUserName,ParameterValue=<GITHUB_USERNAME> \
                 ParameterKey=GithubRepo,ParameterValue=${SERVICE_NAME} \
                 ParameterKey=GitHubToken,ParameterValue=<OAUTHTOKEN> \
    --capabilities CAPABILITY_NAMED_IAM
```

## Test your Deployment

After the CodePipeline has finished, Fargate Cluster should be up and running now.

1. Go to EC2 Service -> Load Balancers and find the DNS address

2. Using DNS address you just obtained run:

```
curl http://<DNS_FROM_PRREVIOUS_STEP>/user
```

or point your browser to

```
http://<DNS_FROM_PRREVIOUS_STEP>
```
