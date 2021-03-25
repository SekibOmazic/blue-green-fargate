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

You'll need a domain registered with Route53 and an SSL Certificate in AWS Certificate Manager.

### Deploy Lambda Hook

First you need to checkout [lambda hook repo](https://github.com/SekibOmazic/codedeploy-lifecycle-event-hooks)

Create and deploy the stack by following instruction found in README.md

### Create stack

Define following variables in your terminal:

```
GITHUB_USERNAME=<github user name>
GITHUB_REPO=<github repo name>
GITHUB_OAUTH_TOKEN=<oauth token for your github account>
DOMAIN_NAME=<service domain name e.g. blue-green-api.my-domain.com>
HOSTED_ZONE_ID=<hosted zone id from Route53>
SSL_CERT_ARN=<ssl certificate arn>
```

And then create the pipeline stack:

```
aws cloudformation create-stack --stack-name ${GITHUB_REPO}-pipeline \
    --template-body file://$PWD/cloudformation/cicd/pipeline.yaml \
    --parameters ParameterKey=GithubUsername,ParameterValue=${GITHUB_USERNAME} \
                 ParameterKey=GithubRepo,ParameterValue=${GITHUB_REPO} \
                 ParameterKey=GithubOAuthToken,ParameterValue=${GITHUB_OAUTH_TOKEN} \
                 ParameterKey=DomainName,ParameterValue=${DOMAIN_NAME} \
                 ParameterKey=HostedZoneId,ParameterValue=${HOSTED_ZONE_ID} \
                 ParameterKey=SslCertificateArn,ParameterValue=${SSL_CERT_ARN} \
    --capabilities CAPABILITY_NAMED_IAM
```

### Test your deployment

After the CodePipeline has finished, Fargate Cluster should be up and running now.

1. Go to EC2 Service -> Load Balancers and find the DNS address

2. Using DNS address you just obtained run:

```
curl https://<DOMAIN_NAME>/user
```

or point your browser to

```
https://<DOMAIN_NAME>
```

### Configure rollback alarms

After creating stack you need to manually configure CloudWatch alarms which can rollback stack update:

```
AWS_ACCOUNT_ID=`aws sts get-caller-identity --query Account --output text`

aws cloudformation update-stack \
   --region us-east-1 \
   --stack-name ${GITHUB_REPO} \
   --use-previous-template \
   --capabilities CAPABILITY_IAM \
   --rollback-configuration "RollbackTriggers=[{Arn=arn:aws:cloudwatch:us-east-1:$AWS_ACCOUNT_ID:alarm:${STACK_NAME}-Unhealthy-Hosts-Blue,Type=AWS::CloudWatch::Alarm},{Arn=arn:aws:cloudwatch:us-east-1:$AWS_ACCOUNT_ID:alarm:${STACK_NAME}-Http-500-Blue,Type=AWS::CloudWatch::Alarm},{Arn=arn:aws:cloudwatch:us-east-1:$AWS_ACCOUNT_ID:alarm:${STACK_NAME}-Unhealthy-Hosts-Green,Type=AWS::CloudWatch::Alarm},{Arn=arn:aws:cloudwatch:us-east-1:$AWS_ACCOUNT_ID:alarm:${STACK_NAME}-Http-500-Green,Type=AWS::CloudWatch::Alarm}]"
```
