# Simple REST API deployed on AWS Fargate using blue/green deployment

This is a code repository for the very simple REST API with Node.js and Express. API is packaged as Docker container and deployed on AWS using AWS Fargate and Blue/Green deployment

This repo depends on [lambda hook repo](https://github.com/SekibOmazic/codedeploy-lifecycle-event-hooks) which is used for testing of the green environment.

## What it does?

Application uses 2 target groups to shift the traffic between blue (current) and green (next) deployments. After deploying application on AWS (instruction shown below) open 2 browser tabs with
`https://DOMAIN_NAME` and `https://DOMAIN_NAME:9000`
Both tabs will show a page with the blue background.

Change background to green (see index.js, line 13) and codepipeline will trigger a new deployment. After some time the test environment (running on port 9000) will show the green background. When the green environment is up and serving the traffic please refresh the blue one (port 443) a couple of times to see how traffic is being shifted. You'll start receiving the green background.
After the deployment is done only you'll receive only the green page.

If you want to simulate rollback, try changing the color to red (again, see index.js, line 13). This will trigger the pipeline again but this time the test environment will show the red page. As soon as the deployment Lambda hook is triggered it will query the /color endpoint and if the received color is not blue nor green it will signal the failure to the pipeline and the deployment will be rolled back. Your production environment will never show the red page.

## How to run

Just `npm start` and point your browser to `url http://localhost:80/color` to get the current background color as JSON object. Or just load `url http://localhost:80` start page to see it ;-)

Alternatively, you can build the docker image and run it:

```
docker build -t blue-green-api .
docker run -it -p 80:80 --rm blue-green-api:latest
```

### Health status

`curl http://localhost:80/health`

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
curl https://<DOMAIN_NAME>/color
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
   --capabilities CAPABILITY_NAMED_IAM \
   --parameters \
        ParameterKey=ImageURI,UsePreviousValue=true \
        ParameterKey=EcrRepoName,UsePreviousValue=true \
        ParameterKey=DomainName,UsePreviousValue=true \
        ParameterKey=HostedZoneId,UsePreviousValue=true \
        ParameterKey=SslCertificateArn,UsePreviousValue=true \
   --rollback-configuration "RollbackTriggers=[{Arn=arn:aws:cloudwatch:us-east-1:$AWS_ACCOUNT_ID:alarm:${GITHUB_REPO}-Unhealthy-Hosts-Blue,Type=AWS::CloudWatch::Alarm},{Arn=arn:aws:cloudwatch:us-east-1:$AWS_ACCOUNT_ID:alarm:${GITHUB_REPO}-Http-500-Blue,Type=AWS::CloudWatch::Alarm},{Arn=arn:aws:cloudwatch:us-east-1:$AWS_ACCOUNT_ID:alarm:${GITHUB_REPO}-Unhealthy-Hosts-Green,Type=AWS::CloudWatch::Alarm},{Arn=arn:aws:cloudwatch:us-east-1:$AWS_ACCOUNT_ID:alarm:${GITHUB_REPO}-Http-500-Green,Type=AWS::CloudWatch::Alarm}]"

```
