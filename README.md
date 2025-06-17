# NASA APOD Wallpaper Carousel

A simple React + TypeScript + Vite application that fetches images from NASA's Astronomy Picture of the Day (APOD) API and displays them in a full-screen carousel with fade transitions.

🌐 **Live Website**: [https://wallpaper.rbios.net](https://wallpaper.rbios.net)

## Features

- Fetches random images on load and refreshes periodically
- Rotates images automatically with smooth fade transitions
- Caches image URLs in localStorage for performance
- Full-screen carousel display optimized for wallpaper viewing
- Responsive design for various screen sizes

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Build Tools**: [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) with [Babel](https://babeljs.io/) for Fast Refresh
- **Infrastructure**: AWS S3 + CloudFront + Route53
- **CI/CD**: GitHub Actions
- **SSL**: AWS Certificate Manager (ACM)

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Infrastructure

### AWS Architecture

```
GitHub Repository
    ↓ (GitHub Actions)
AWS S3 Bucket (rjmette-wallpaper)
    ↓ (Origin)
AWS CloudFront Distribution
    ↓ (SSL/TLS)
Custom Domain (wallpaper.rbios.net)
    ↓ (Route53 Alias)
End Users
```

### Components

- **S3 Bucket**: `rjmette-wallpaper` (Static website hosting)
- **CloudFront Distribution**: `E3T87UCNP843YL` (Global CDN)
- **SSL Certificate**: ACM certificate for `wallpaper.rbios.net`
- **DNS**: Route53 hosted zone for `rbios.net`
- **Domain**: `wallpaper.rbios.net` (Custom domain with SSL)

## Deployment

This project features automatic deployment to AWS infrastructure using GitHub Actions.

### 🌐 Website URLs

- **Primary**: [https://wallpaper.rbios.net](https://wallpaper.rbios.net) *(Custom domain with SSL)*
- **CloudFront**: [https://dfag5wjhwtow6.cloudfront.net](https://dfag5wjhwtow6.cloudfront.net) *(CDN endpoint)*
- **S3 Direct**: [http://rjmette-wallpaper.s3-website-us-east-1.amazonaws.com](http://rjmette-wallpaper.s3-website-us-east-1.amazonaws.com) *(Origin)*

### 🔧 Setup Requirements

1. **GitHub Repository Secrets**:
   ```
   AWS_ACCESS_KEY_ID     = Your AWS access key
   AWS_SECRET_ACCESS_KEY = Your AWS secret access key
   ```
   
   Add these at: Repository Settings → Secrets and variables → Actions → New repository secret

2. **AWS Resources** (Already configured):
   - S3 bucket with static website hosting enabled
   - CloudFront distribution with custom domain
   - ACM SSL certificate (validated via DNS)
   - Route53 alias record pointing to CloudFront

### 🚀 Deployment Process

The GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically:

1. **Triggers**: On push to `main` branch or pull request
2. **Build**: 
   - Installs dependencies with `npm ci`
   - Builds React app with `npm run build`
3. **Deploy**:
   - Syncs `dist/` folder to S3 bucket
   - Invalidates CloudFront cache for immediate updates
4. **Result**: Website updates are live within minutes

### 🔨 Manual Deployment

For manual deployments or local testing:

```bash
# Build the project
npm run build

# Deploy to S3 (requires AWS CLI configured)
aws s3 sync dist/ s3://rjmette-wallpaper --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id E3T87UCNP843YL --paths "/*"
```

## Infrastructure Details

### S3 Configuration
- **Bucket**: `rjmette-wallpaper`
- **Website Hosting**: Enabled
- **Index Document**: `index.html`
- **Error Document**: `index.html` (SPA routing)
- **Public Access**: Configured for website hosting

### CloudFront Configuration
- **Distribution ID**: `E3T87UCNP843YL`
- **Origin**: S3 bucket website endpoint
- **Caching**: Optimized for static assets
- **HTTPS**: Forced redirect from HTTP
- **Custom Domain**: `wallpaper.rbios.net`
- **Price Class**: PriceClass_100 (US, Canada, Europe)

### SSL Certificate
- **Type**: AWS Certificate Manager (ACM)
- **Domain**: `wallpaper.rbios.net`
- **Validation**: DNS validation via Route53
- **Status**: ✅ Issued and active

### Route53 Configuration
- **Hosted Zone**: `rbios.net` (`Z041460211TNUBYCOAMFZ`)
- **Record Type**: A record (Alias)
- **Target**: CloudFront distribution
- **TTL**: Automatic (CloudFront managed)

## Performance Features

- **Global CDN**: CloudFront edge locations worldwide
- **HTTPS**: SSL/TLS encryption for secure connections
- **Compression**: Automatic asset compression
- **Caching**: Intelligent caching strategies
- **Fast Refresh**: Development hot-reloading

## Monitoring & Maintenance

- **Deployment Status**: Monitor via GitHub Actions tab
- **Website Health**: Check at [https://wallpaper.rbios.net](https://wallpaper.rbios.net)
- **CloudFront Metrics**: Available in AWS CloudWatch
- **Certificate Renewal**: Automatic via ACM

---

## Contributing

1. Fork the repository (now publicly available)
2. Create a feature branch
3. Make your changes
4. Test locally with `npm run dev`
5. Push to your branch and create a pull request
6. Deployment happens automatically on merge to `main`

### Ways to Contribute
- 🐛 Report bugs via GitHub Issues
- 💡 Suggest new features or improvements
- 📝 Improve documentation
- 🎨 Enhance the UI/UX
- ⚡ Optimize performance
- 🧪 Add tests

## License

This project is open source and available under the MIT License. See the [LICENSE](LICENSE) file for details.
