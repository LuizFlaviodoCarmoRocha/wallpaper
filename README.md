# NASA APOD Wallpaper Carousel

A simple React + TypeScript + Vite application that fetches images from NASA's Astronomy Picture of the Day (APOD) API and displays them in a full-screen carousel with fade transitions.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Defaults

- Fetches 10 random images on load and every 60 minutes
- Rotates images every 60 seconds
- Caches image URLs in localStorage

## Deployment

This project is configured for automatic deployment to AWS S3 using GitHub Actions.

### Setup

1. **AWS Credentials**: Add the following secrets to your GitHub repository:
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
   
   Go to Settings → Secrets and variables → Actions → New repository secret

2. **S3 Bucket**: The deployment targets the `rjmette-wallpaper` S3 bucket configured for static website hosting.

3. **Automatic Deployment**: 
   - Pushes to `main` branch automatically trigger deployment
   - The workflow builds the React app and syncs the `dist/` folder to S3
   - Invalidates CloudFront cache for immediate updates
   - Website URLs:
     - Primary: https://wallpaper.rbios.net
     - CloudFront: https://dfag5wjhwtow6.cloudfront.net
     - S3 Direct: http://rjmette-wallpaper.s3-website-us-east-1.amazonaws.com

### Manual Deployment

```bash
npm run build
aws s3 sync dist/ s3://rjmette-wallpaper --delete
```
