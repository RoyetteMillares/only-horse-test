# Environment Setup Guide

## Quick Start

1. **Copy the environment template:**
   ```bash
   cp env.example .env.local
   ```

2. **Configure required variables in `.env.local`:**

### Required Variables

#### 1. Database Configuration
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/socially?schema=public"
```

**Setup PostgreSQL:**
```bash
# Install PostgreSQL (if not installed)
# macOS: brew install postgresql
# Windows: Download from https://www.postgresql.org/download/windows/
# Linux: sudo apt-get install postgresql

# Create database
psql -U postgres
CREATE DATABASE socially;
\q

# Run Prisma migrations
npx prisma migrate dev --name init
npx prisma generate
```

#### 2. NextAuth Secret
```env
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

**Generate secure secret:**
```bash
# On macOS/Linux:
openssl rand -base64 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

#### 3. Stripe Configuration
```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

**Setup Stripe:**
1. Create account at https://dashboard.stripe.com/register
2. Get API keys from https://dashboard.stripe.com/test/apikeys
3. Install Stripe CLI: https://stripe.com/docs/stripe-cli
4. Forward webhooks locally:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### Optional Variables

#### OAuth Providers (Optional)

**Google OAuth:**
1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID and Secret

```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

**Facebook OAuth:**
1. Go to https://developers.facebook.com/apps/
2. Create new app
3. Add Facebook Login product
4. Add redirect URI: `http://localhost:3000/api/auth/callback/facebook`
5. Copy App ID and Secret

```env
FACEBOOK_CLIENT_ID="your-facebook-app-id"
FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"
```

#### AWS S3 Configuration (Required for File Uploads)

**Setup AWS S3:**

1. **Create S3 Bucket:**
   - Go to https://console.aws.amazon.com/s3/
   - Click "Create bucket"
   - Choose a unique bucket name (e.g., `your-app-images`)
   - Select region (e.g., `us-east-1`)
   - **Uncheck "Block all public access"** (or configure public read access for images)
   - Click "Create bucket"

2. **Configure CORS (Critical for Browser Uploads):**
   - In your S3 bucket, go to **Permissions** tab
   - Scroll to **Cross-origin resource sharing (CORS)**
   - Click **Edit** and paste the following configuration:

```json
[
  {
    "AllowedHeaders": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "HEAD"
    ],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-production-domain.com"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-server-side-encryption",
      "x-amz-request-id",
      "x-amz-id-2"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

   **Important:** Replace `https://your-production-domain.com` with your actual production domain.

3. **Create IAM User for S3 Access:**
   - Go to https://console.aws.amazon.com/iam/
   - Click "Users" → "Create user"
   - Username: `s3-upload-user` (or your choice)
   - Select "Application running outside AWS"
   - Click "Next"
   - Click "Create policy" (opens new tab)
   - Use JSON editor and paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME"
    }
  ]
}
```

   - Replace `YOUR-BUCKET-NAME` with your actual bucket name
   - Name the policy: `S3UploadPolicy`
   - Click "Create policy"
   - Go back to user creation tab, refresh, select `S3UploadPolicy`
   - Click "Next" → "Create user"
   - Click on the user → "Security credentials" tab
   - Click "Create access key"
   - Select "Application running outside AWS"
   - Click "Next" → "Create access key"
   - **Copy Access Key ID and Secret Access Key immediately** (secret is shown only once)

4. **Update Environment Variables:**

```env
AWS_ACCESS_KEY_ID="your-access-key-id"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
AWS_S3_BUCKET="your-bucket-name"
AWS_S3_REGION="us-east-1"
```

**Troubleshooting CORS Errors:**

If you see `Access-Control-Allow-Origin` errors:
- Verify CORS configuration in S3 bucket Permissions tab
- Ensure your origin (localhost:3000 or production domain) is in `AllowedOrigins`
- Check that `PUT` method is in `AllowedMethods`
- Clear browser cache and try again
- Verify bucket name and region match your `.env` file

## Running the Application

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# Start development server
npm run dev
```

Visit http://localhost:3000

## Minimal Development Setup

For quick testing without OAuth or Stripe:

```env
# .env.local (minimal)
DATABASE_URL="postgresql://postgres:password@localhost:5432/socially?schema=public"
NEXTAUTH_SECRET="development-secret-replace-in-production"
NEXTAUTH_URL="http://localhost:3000"
STRIPE_SECRET_KEY="sk_test_placeholder"
STRIPE_PUBLISHABLE_KEY="pk_test_placeholder"
STRIPE_WEBHOOK_SECRET="whsec_placeholder"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
FACEBOOK_CLIENT_ID=""
FACEBOOK_CLIENT_SECRET=""
```

**Note:** With this setup, only email/password authentication will work. Stripe features will fail.

## Production Deployment

### Environment Variables Checklist

- [ ] `DATABASE_URL` - Production PostgreSQL connection string
- [ ] `NEXTAUTH_SECRET` - Strong random secret (32+ characters)
- [ ] `NEXTAUTH_URL` - Production domain (e.g., https://yourdomain.com)
- [ ] `STRIPE_SECRET_KEY` - Live mode key (starts with `sk_live_`)
- [ ] `STRIPE_WEBHOOK_SECRET` - Production webhook secret
- [ ] `GOOGLE_CLIENT_ID` - Production OAuth credentials
- [ ] `GOOGLE_CLIENT_SECRET` - Production OAuth credentials
- [ ] `FACEBOOK_CLIENT_ID` - Production OAuth credentials
- [ ] `FACEBOOK_CLIENT_SECRET` - Production OAuth credentials

### Security Best Practices

1. **Never commit `.env.local` or `.env` files**
2. **Use different secrets for each environment**
3. **Rotate secrets regularly**
4. **Use environment-specific Stripe keys**
5. **Enable 2FA on all service accounts**
6. **Restrict API key permissions**
7. **Use connection pooling for database (PgBouncer/RDS Proxy)**

## Troubleshooting

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL

# Check Prisma connection
npx prisma db pull
```

### NextAuth Issues
- Ensure `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Verify OAuth redirect URIs match exactly

### Stripe Webhook Issues
- Use Stripe CLI for local testing
- Verify webhook secret matches Stripe dashboard
- Check webhook endpoint is publicly accessible in production

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Stripe Documentation](https://stripe.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

---

**— Royette**

*This setup guide provides L10-level operational excellence for environment configuration, security hardening, and production deployment readiness.*

