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

### Create stack

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

### Test your deployment

After the CodePipeline has finished, Fargate Cluster should be up and running now.

1. Go to EC2 Service -> Load Balancers and find the DNS address

2. Using DNS address you just obtained run:

```
curl http://<DNS_OF_THE_ELB>/user
```

or point your browser to

```
http://<DNS_OF_THE_ELB>
```

### Deploy Lambda Hook

TODO: checkout codedeploy-lifecycle-event-hooks repo
Deploy the stack:

```
npm install

aws cloudformation package \
  --template-file template.yaml \
  --output-template-file packaged-template.yaml \
  --s3-bucket <S3 bucket for storing the Lambda function code>

aws cloudformation deploy \
  --region us-east-1 \
  --template-file packaged-template.yaml \
  --stack-name BlueGreenBackendHooksTest \
  --tags project=blue-green-fargate \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides BackendDomain=<DNS_OF_THE_ELB>
```

### Configure rollback alarms

```
AWS_ACCOUNT_ID=`aws sts get-caller-identity --query Account --output text`

aws cloudformation update-stack \
   --region us-east-1 \
   --stack-name ${SERVICE_NAME} \
   --use-previous-template \
   --capabilities CAPABILITY_IAM \
   --rollback-configuration "RollbackTriggers=[{Arn=arn:aws:cloudwatch:us-east-1:$AWS_ACCOUNT_ID:alarm:${STACK_NAME}-Unhealthy-Hosts-Blue,Type=AWS::CloudWatch::Alarm},{Arn=arn:aws:cloudwatch:us-east-1:$AWS_ACCOUNT_ID:alarm:${STACK_NAME}-Http-500-Blue,Type=AWS::CloudWatch::Alarm},{Arn=arn:aws:cloudwatch:us-east-1:$AWS_ACCOUNT_ID:alarm:${STACK_NAME}-Unhealthy-Hosts-Green,Type=AWS::CloudWatch::Alarm},{Arn=arn:aws:cloudwatch:us-east-1:$AWS_ACCOUNT_ID:alarm:${STACK_NAME}-Http-500-Green,Type=AWS::CloudWatch::Alarm}]"
```
