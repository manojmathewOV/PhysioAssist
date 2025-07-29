# PhysioAssist Deployment Guide

## Web Deployment

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Web hosting service (Netlify, Vercel, AWS S3, etc.)

### Build Process

1. **Install Dependencies**
```bash
npm install --legacy-peer-deps
```

2. **Build for Production**
```bash
npm run build:web
```
This creates optimized files in the `dist/` directory.

3. **Test Build Locally**
```bash
npx serve dist
```

### Deployment Options

#### Option 1: Netlify

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Deploy:
```bash
netlify deploy --prod --dir=dist
```

#### Option 2: Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel --prod
```

#### Option 3: AWS S3 + CloudFront

1. Build the project:
```bash
npm run build:web
```

2. Upload to S3:
```bash
aws s3 sync dist/ s3://your-bucket-name --delete
```

3. Invalidate CloudFront cache:
```bash
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

#### Option 4: GitHub Pages

1. Install gh-pages:
```bash
npm install --save-dev gh-pages
```

2. Add to package.json:
```json
"scripts": {
  "predeploy": "npm run build:web",
  "deploy": "gh-pages -d dist"
}
```

3. Deploy:
```bash
npm run deploy
```

### Environment Variables

Create a `.env.production` file:
```env
# API endpoints (if any)
REACT_APP_API_URL=https://api.physioassist.com

# Analytics (optional)
REACT_APP_GA_TRACKING_ID=UA-XXXXXXXXX-X

# Feature flags
REACT_APP_ENABLE_ANALYTICS=true
```

### SSL Configuration

Ensure HTTPS is enabled for:
- Camera access (required)
- MediaPipe model loading
- Security best practices

## Mobile Deployment

### iOS Deployment

#### Prerequisites
- macOS with Xcode 14+
- Apple Developer Account ($99/year)
- iOS device for testing

#### Build Process

1. **Install dependencies**:
```bash
npm install --legacy-peer-deps
cd ios && pod install
```

2. **Open in Xcode**:
```bash
open ios/PhysioAssist.xcworkspace
```

3. **Configure signing**:
- Select your team in Signing & Capabilities
- Update bundle identifier if needed

4. **Build for release**:
- Select "Any iOS Device" as target
- Product → Archive
- Follow the distribution wizard

#### TestFlight Beta Testing

1. Upload to App Store Connect
2. Add internal/external testers
3. Submit for review (external only)

#### App Store Submission

1. Prepare assets:
   - App icon (1024x1024)
   - Screenshots for all device sizes
   - App preview video (optional)

2. Complete App Store listing:
   - Description
   - Keywords
   - Categories
   - Privacy policy URL

3. Submit for review

### Android Deployment

#### Prerequisites
- Android Studio
- Google Play Developer Account ($25 one-time)
- Signing key

#### Build Process

1. **Generate signing key** (first time only):
```bash
cd android/app
keytool -genkeypair -v -keystore release.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. **Configure signing** in `android/app/build.gradle`:
```gradle
signingConfigs {
    release {
        storeFile file('release.keystore')
        storePassword 'your-password'
        keyAlias 'my-key-alias'
        keyPassword 'your-password'
    }
}
```

3. **Build APK**:
```bash
cd android
./gradlew assembleRelease
```

4. **Build AAB** (for Play Store):
```bash
./gradlew bundleRelease
```

#### Google Play Console

1. Create app listing
2. Upload AAB file
3. Complete store listing:
   - Title and description
   - Screenshots
   - Content rating
   - Target audience

4. Roll out to testing track
5. Submit for production review

## CI/CD Pipeline

### GitHub Actions

The project includes GitHub Actions workflow for:
- Running tests on PR
- Building web version
- Building Android APK
- Uploading artifacts

### Automated Deployment

Add deployment step to `.github/workflows/ci.yml`:

```yaml
deploy-web:
  needs: build-web
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main'
  
  steps:
  - uses: actions/checkout@v3
  
  - name: Download artifacts
    uses: actions/download-artifact@v3
    with:
      name: web-build
      path: dist
  
  - name: Deploy to Netlify
    uses: nwtgck/actions-netlify@v2.0
    with:
      publish-dir: './dist'
      production-branch: main
      github-token: ${{ secrets.GITHUB_TOKEN }}
      deploy-message: "Deploy from GitHub Actions"
    env:
      NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
      NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## Monitoring

### Web Analytics

1. Add Google Analytics:
```html
<!-- In public/index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

2. Add Sentry for error tracking:
```javascript
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: process.env.NODE_ENV,
});
```

### Performance Monitoring

1. Use Lighthouse for web performance
2. Monitor Core Web Vitals
3. Track pose detection FPS
4. Monitor memory usage

## Rollback Strategy

### Web
1. Keep previous build artifacts
2. Update CDN to point to previous version
3. Clear cache if needed

### Mobile
1. Use phased rollout (10% → 50% → 100%)
2. Monitor crash reports
3. Halt rollout if issues detected
4. Submit hotfix if critical

## Security Checklist

- [ ] HTTPS enabled
- [ ] Camera permissions handled properly
- [ ] No hardcoded secrets
- [ ] API keys in environment variables
- [ ] Code obfuscation for production
- [ ] Security headers configured
- [ ] Content Security Policy set
- [ ] Regular dependency updates

## Post-Deployment

1. **Monitor crash reports**
2. **Check analytics**
3. **Gather user feedback**
4. **Plan next iteration**
5. **Update documentation**

## Troubleshooting

### Common Issues

#### Build fails on CI
- Check Node version
- Clear cache
- Update dependencies

#### Camera not working on web
- Ensure HTTPS
- Check browser permissions
- Test on different browsers

#### App rejected from store
- Review guidelines
- Fix reported issues
- Resubmit with explanations

#### Performance issues
- Profile with Chrome DevTools
- Optimize bundle size
- Implement code splitting