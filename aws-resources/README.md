# AWS Resources for Wallpaper Trivia App

## Overview
This document lists all AWS resources created for the wallpaper trivia application.

## Resources Created

### 1. Lambda Function
- **Name**: `bedrock-proxy`
- **Runtime**: Python 3.9
- **Handler**: `lambda_function_openai.lambda_handler`
- **Region**: us-east-1
- **ARN**: `arn:aws:lambda:us-east-1:416792107027:function:bedrock-proxy`
- **Timeout**: 30 seconds
- **Purpose**: Generates astronomical trivia facts using OpenAI API with fallback to mock facts

### 2. IAM Role
- **Name**: `BedrockProxyLambdaRole`
- **Purpose**: Execution role for the Lambda function
- **Permissions**:
  - AWS Lambda Basic Execution Role
  - Secrets Manager read access for OpenAI API key
  - Bedrock invoke permissions (legacy, can be removed)

### 3. API Gateway REST API
- **Name**: `wallpaper-bedrock-lambda-api`
- **API ID**: `x36464naae`
- **Stage**: `prod`
- **Endpoint**: `https://x36464naae.execute-api.us-east-1.amazonaws.com/prod/bedrock/invoke`
- **Methods**: POST, OPTIONS (CORS enabled)
- **Purpose**: HTTP endpoint for the React app to call the Lambda function

### 4. AWS Secrets Manager
- **Secret Name**: `wallpaper-app/openai-api-key`
- **ARN**: `arn:aws:secretsmanager:us-east-1:416792107027:secret:wallpaper-app/openai-api-key-sSNFDU`
- **Purpose**: Securely stores OpenAI API key
- **Format**: `{"OPENAI_API_KEY": "your-key-here"}`

## Setup Instructions

### Update OpenAI API Key
To enable real OpenAI responses, update the secret with your actual API key:

```bash
aws secretsmanager update-secret \
  --secret-id wallpaper-app/openai-api-key \
  --secret-string '{"OPENAI_API_KEY":"your-actual-openai-key-here"}' \
  --region us-east-1
```

### Testing the Lambda Function
You can test the function directly:

```bash
aws lambda invoke \
  --function-name bedrock-proxy \
  --payload '{"httpMethod": "POST", "body": "{\"prompt\": \"Generate 3 facts about Eagle Nebula\"}"}' \
  --region us-east-1 \
  response.json
```

### Monitoring
- **CloudWatch Logs**: `/aws/lambda/bedrock-proxy`
- **Metrics**: Available in AWS Lambda console

## Architecture
```
React App → API Gateway → Lambda Function → OpenAI API
                                       ↓
                              AWS Secrets Manager
                                       ↓ 
                              Fallback Mock Facts
```

## Cost Considerations
- **Lambda**: Pay per invocation (~$0.0000002 per request)
- **API Gateway**: Pay per API call (~$1 per million requests)
- **Secrets Manager**: ~$0.40 per secret per month
- **OpenAI API**: Pay per token usage (varies by model)

## Security
- API key stored securely in AWS Secrets Manager
- CORS properly configured for web access
- Lambda function follows least privilege principle

## CORS Configuration

The Lambda function implements dynamic CORS handling for security:

### Allowed Origins
- `https://wallpaper.rbios.net` - Production domain
- `https://dfag5wjhwtow6.cloudfront.net` - CloudFront distribution  
- `http://localhost:*` - Development servers (any port)

### Security Features
- Request origin is validated against allowlist
- Specific origin returned in `Access-Control-Allow-Origin` header
- 24-hour cache max-age for preflight requests
- Graceful handling of unknown origins

### Testing CORS
```bash
# Test production domain
curl -H "Origin: https://wallpaper.rbios.net" \
     -H "Content-Type: application/json" \
     -X POST \
     -d '{"prompt": "Generate 3 facts about stars"}' \
     https://x36464naae.execute-api.us-east-1.amazonaws.com/prod/bedrock/invoke

# Test CloudFront domain  
curl -H "Origin: https://dfag5wjhwtow6.cloudfront.net" \
     -H "Content-Type: application/json" \
     -X POST \
     -d '{"prompt": "Generate 3 facts about galaxies"}' \
     https://x36464naae.execute-api.us-east-1.amazonaws.com/prod/bedrock/invoke
```
