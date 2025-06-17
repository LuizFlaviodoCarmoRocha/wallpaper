# Infrastructure Documentation

This document provides detailed technical information about the AWS infrastructure supporting the NASA APOD Wallpaper Carousel application.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GitHub Repo   │───▶│  GitHub Actions  │───▶│   AWS S3 Bucket │
│  (Source Code)  │    │   (CI/CD Pipeline)│    │ (rjmette-wallpaper)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   End Users     │◀───│    Route53 DNS   │◀───│   CloudFront    │
│                 │    │   (rbios.net)    │    │  Distribution   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                ▲                        ▲
                                │                        │
                         ┌──────────────────┐           │
                         │   ACM SSL Cert   │───────────┘
                         │ (wallpaper.rbios.net)│
                         └──────────────────┘
```

## AWS Resources

### S3 Bucket Configuration

**Bucket Name**: `rjmette-wallpaper`
**Region**: `us-east-1`
**Created**: March 9, 2025

#### Bucket Properties
- **Static Website Hosting**: Enabled
- **Index Document**: `index.html`
- **Error Document**: `index.html` (for SPA routing)
- **Versioning**: Disabled
- **Public Access Block**: Disabled (configured for public website)

#### Bucket Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::rjmette-wallpaper/*"
    }
  ]
}
```

#### Website Endpoint
`http://rjmette-wallpaper.s3-website-us-east-1.amazonaws.com`

### CloudFront Distribution

**Distribution ID**: `E3T87UCNP843YL`
**Status**: Deployed
**Created**: June 17, 2025

#### Origin Configuration
- **Origin Domain**: `rjmette-wallpaper.s3-website-us-east-1.amazonaws.com`
- **Origin Protocol Policy**: HTTP Only
- **Origin Path**: `/` (root)

#### Behavior Configuration
- **Viewer Protocol Policy**: Redirect HTTP to HTTPS
- **Allowed HTTP Methods**: GET, HEAD
- **Cached HTTP Methods**: GET, HEAD
- **Cache Policy**: Default (24 hours)
- **Compress Objects**: Enabled

#### Distribution Settings
- **Price Class**: PriceClass_100 (US, Canada, Europe)
- **IPv6**: Enabled
- **Default Root Object**: `index.html`
- **Custom Error Pages**: Not configured
- **Logging**: Disabled

#### SSL/TLS Configuration
- **Certificate Source**: AWS Certificate Manager (ACM)
- **Certificate ARN**: `arn:aws:acm:us-east-1:416792107027:certificate/8decdf4b-128f-4a2c-8e69-a4024d1123c2`
- **Minimum Protocol Version**: TLSv1.2_2021
- **SSL Support Method**: SNI Only

#### Custom Domain
- **CNAME**: `wallpaper.rbios.net`
- **Status**: Active

### SSL Certificate (ACM)

**Certificate ARN**: `arn:aws:acm:us-east-1:416792107027:certificate/8decdf4b-128f-4a2c-8e69-a4024d1123c2`
**Domain**: `wallpaper.rbios.net`
**Status**: Issued
**Validation Method**: DNS

#### Validation Record
- **Type**: CNAME
- **Name**: `_8405bcd73bcaf997ae61b76dffccaa26.wallpaper.rbios.net.`
- **Value**: `_b21e49bd8f36b6b59fcc0b9002f10114.xlfgrmvvlj.acm-validations.aws.`

### Route53 Configuration

**Hosted Zone**: `rbios.net`
**Hosted Zone ID**: `Z041460211TNUBYCOAMFZ`
**Type**: Public Hosted Zone

#### DNS Records

##### Subdomain Alias Record
- **Name**: `wallpaper.rbios.net`
- **Type**: A (Alias)
- **Target**: CloudFront distribution (`dfag5wjhwtow6.cloudfront.net`)
- **CloudFront Hosted Zone ID**: `Z2FDTNDATAQYW2`
- **TTL**: Automatic (managed by CloudFront)

##### Certificate Validation Record
- **Name**: `_8405bcd73bcaf997ae61b76dffccaa26.wallpaper.rbios.net.`
- **Type**: CNAME
- **Value**: `_b21e49bd8f36b6b59fcc0b9002f10114.xlfgrmvvlj.acm-validations.aws.`
- **TTL**: 300 seconds

## CI/CD Pipeline

### GitHub Actions Workflow

**File**: `.github/workflows/deploy.yml`
**Triggers**: Push to `main` branch, Pull requests to `main`

#### Workflow Steps
1. **Checkout code** (`actions/checkout@v4`)
2. **Setup Node.js 18** (`actions/setup-node@v4`) with npm caching
3. **Install dependencies** (`npm ci`)
4. **Build project** (`npm run build`)
5. **Configure AWS credentials** (`aws-actions/configure-aws-credentials@v4`)
6. **Deploy to S3** (`aws s3 sync dist/ s3://rjmette-wallpaper --delete`)
7. **Invalidate CloudFront** (`aws cloudfront create-invalidation`)

#### Required Secrets
- `AWS_ACCESS_KEY_ID`: IAM user access key
- `AWS_SECRET_ACCESS_KEY`: IAM user secret key

#### Permissions Required
- `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket` on `rjmette-wallpaper` bucket
- `cloudfront:CreateInvalidation` on distribution `E3T87UCNP843YL`

## Security Configuration

### IAM Considerations
- Use dedicated IAM user for GitHub Actions with minimal required permissions
- Regular rotation of access keys recommended
- Consider using OIDC provider for keyless authentication

### HTTPS/SSL
- All traffic redirected to HTTPS via CloudFront
- TLS 1.2+ enforced
- Automatic certificate renewal via ACM

### S3 Security
- Bucket policy allows public read access only
- No write access from public internet
- Deployment access restricted to GitHub Actions

## Performance Characteristics

### Caching Strategy
- **Static Assets**: Cached at CloudFront edge locations
- **HTML Files**: Default 24-hour cache
- **Cache Invalidation**: Automatic on deployment

### Global Distribution
- **Edge Locations**: US, Canada, Europe (PriceClass_100)
- **Origin Shield**: Not configured
- **Regional Edge Caches**: Enabled by default

### Monitoring

#### CloudWatch Metrics (Available)
- **CloudFront**:
  - Requests
  - Data Transfer
  - Origin Response Time
  - Cache Hit Ratio
  - Error Rates (4xx, 5xx)

- **S3**:
  - Request Metrics
  - Storage Metrics
  - Data Transfer

#### Logs
- **CloudFront Access Logs**: Disabled (can be enabled if needed)
- **S3 Access Logs**: Disabled
- **GitHub Actions Logs**: Available in repository Actions tab

## Cost Optimization

### Current Configuration
- **S3**: Minimal cost (static website, no additional storage classes)
- **CloudFront**: PriceClass_100 for cost-effective global distribution
- **Route53**: Standard hosted zone pricing
- **ACM**: Free SSL certificates
- **Data Transfer**: First 1TB/month free from CloudFront

### Recommendations
- Monitor usage via AWS Cost Explorer
- Consider S3 Intelligent Tiering for large static assets
- Review CloudFront price class based on actual usage patterns

## Disaster Recovery

### Backup Strategy
- **Source Code**: GitHub repository (primary backup)
- **Built Assets**: Reproducible via CI/CD pipeline
- **Infrastructure**: Infrastructure as Code documentation (this document)

### Recovery Procedures
1. **S3 Bucket Loss**: Recreate bucket and redeploy via GitHub Actions
2. **CloudFront Issues**: Distribution can be recreated using documented settings
3. **DNS Issues**: Route53 records documented and can be recreated
4. **Certificate Issues**: ACM certificates can be re-requested and validated

### RTO/RPO
- **Recovery Time Objective (RTO)**: < 30 minutes
- **Recovery Point Objective (RPO)**: Last committed code in GitHub

## Maintenance Tasks

### Regular Tasks
- **Certificate Renewal**: Automatic via ACM (no action required)
- **DNS Health**: Monitor via Route53 health checks (if configured)
- **Cost Review**: Monthly AWS cost analysis
- **Security Review**: Quarterly review of IAM permissions

### Monitoring Alerts (Recommended)
- CloudFront error rate thresholds
- Unusual traffic patterns
- S3 access errors
- Certificate expiration warnings (backup)

---

**Last Updated**: June 17, 2025
**Document Version**: 1.0
**Infrastructure Version**: Production v1
