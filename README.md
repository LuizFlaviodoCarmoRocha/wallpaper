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

## Pop‑Up Video Trivia

As you browse the APOD carousel, this optional feature will periodically pop up fun facts about each image—just like the classic VH1 Pop‑Up Video.

### How it works

- On each image display, we prompt your configured LLM (e.g. OpenAI Chat API) to generate exactly 5 trivia facts about the title/explanation. In development mode, pop-up delays are still sped up, but now by a factor of three for easier iterative testing.
- Trivia bubbles appear every ~25 seconds at random positions over the image, with a little “pop” animation and sound effect.
- Facts are cached per image to avoid repeated API calls during the same session.

**Note:** In development mode, pop-up delays are greatly reduced for easier testing and debugging.

### Getting started

1. **Add your LLM credentials** (e.g. set `OPENAI_API_KEY` in your environment).
2. **Implement the LLM endpoint** at `/api/llm` (see `src/hooks/useLLMFacts.tsx` stub).
3. **Provide a `pop.mp3` sound** in `src/assets/pop.mp3`—this is played when a trivia bubble appears.
4. **Enable or disable** the feature via the menu toggle once in the UI.

See the source code in `src/FactBubble.tsx` and `src/hooks/useLLMFacts.tsx` for implementation details.

---
### Optional: Direct Amazon Bedrock Integration (no server code)

When you’re ready to replace mock trivia with real LLM facts, you can invoke Bedrock directly from the browser via AWS SigV4 and Cognito:

1. **Set up Cognito**: Create a User Pool + Identity Pool and configure your React app (e.g. via AWS Amplify).
2. **Grant Permissions**: Allow your Identity Pool role to call `bedrock:InvokeModel`.
3. **Add env vars** to `.env`:
   ```ini
   VITE_AWS_REGION=us-east-1
   VITE_BEDROCK_IDENTITY_POOL_ID=us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   VITE_BEDROCK_MODEL_ID=anthropic.claude-3
   ```
4. **Install AWS SDK**:
   ```bash
   npm install @aws-sdk/client-bedrock @aws-sdk/credential-provider-cognito-identity
   ```
5. **Swap in** this Bedrock hook in `src/hooks/useLLMFacts.ts` (see code sample above).

---
### Alternative: API Gateway Service‑Proxy to Amazon Bedrock
If SDK constraints prevent a direct client call, configure API Gateway to proxy requests to Bedrock without any Lambda:

1. **Create** an HTTP API in API Gateway.
2. **Add** an AWS service integration:
   - Integration type: AWS Service
   - AWS service: `bedrock`
   - HTTP method: `POST`
   - Action: `InvokeModel`
   - Execution role: IAM role with `bedrock:InvokeModel` permission assumed by API Gateway
3. **Define** a route `/bedrock/invoke` (POST) using that integration.
4. **Enable** CORS so your React app can call the endpoint.

Then in your React app call the HTTP API directly:
```ts
async function fetchFacts(prompt: string) {
  const res = await fetch('https://<api-id>.execute-api.<region>.amazonaws.com/prod/bedrock/invoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      modelId: import.meta.env.VITE_BEDROCK_MODEL_ID,
      modelInvocationBody: JSON.stringify({ prompt }),
    }),
  });
  const json = await res.json();
  return json.facts;
}
```

This approach requires no client‐side SDK upgrade and still leaves your front end free of custom server code.

Now your client will query Bedrock directly—no server code required.
---

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
