# AWS S3 Setup Guide for Profile Image Uploads

**— Royette**

## Prerequisites
- AWS Account (create one at https://aws.amazon.com if you don't have one)
- AWS Free Tier includes 5GB S3 storage (sufficient for development)

## Step 1: Create an S3 Bucket

1. **Log in to AWS Console**
   - Go to https://console.aws.amazon.com
   - Sign in with your AWS account

2. **Navigate to S3**
   - Search for "S3" in the top search bar
   - Click on "S3" service

3. **Create Bucket**
   - Click "Create bucket"
   - **Bucket name**: Choose a unique name (e.g., `your-app-name-profile-images`)
     - Must be globally unique across all AWS accounts
     - Use lowercase letters, numbers, and hyphens only
   - **AWS Region**: Choose closest to you (e.g., `us-east-1`)
   - **Object Ownership**: Keep default (ACLs disabled)
   - **Block Public Access**: **UNCHECK ALL** (we need public read access for images)
   - **Bucket Versioning**: Disable (for now)
   - **Default encryption**: Enable (SSE-S3 is fine)
   - Click "Create bucket"

## Step 2: Configure CORS (Critical!)

1. **Open Your Bucket**
   - Click on the bucket you just created

2. **Go to Permissions Tab**
   - Click "Permissions" tab
   - Scroll to "Cross-origin resource sharing (CORS)"

3. **Edit CORS Configuration**
   - Click "Edit"
   - Paste this configuration:

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
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "http://localhost:3000",
            "http://localhost:3001",
            "https://yourdomain.com"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

   - Replace `https://yourdomain.com` with your production domain
   - Click "Save changes"

## Step 3: Create IAM User for Programmatic Access

1. **Navigate to IAM**
   - Search for "IAM" in AWS Console
   - Click on "IAM" service

2. **Create User**
   - Click "Users" in left sidebar
   - Click "Create user"
   - **User name**: `s3-upload-user` (or any name you prefer)
   - **Access type**: Select "Programmatic access"
   - Click "Next: Permissions"

3. **Attach Policy**
   - Click "Attach policies directly"
   - Search for "S3" and select:
     - `AmazonS3FullAccess` (for development)
     - OR create a custom policy with minimal permissions (see below)
   - Click "Next: Tags" (skip tags)
   - Click "Next: Review"
   - Click "Create user"

4. **Save Credentials**
   - **IMPORTANT**: Copy both:
     - **Access Key ID**
     - **Secret Access Key** (click "Show" to reveal)
   - Save these securely - you won't be able to see the secret key again!

## Step 4: Custom IAM Policy (Optional - More Secure)

Instead of `AmazonS3FullAccess`, you can create a custom policy with minimal permissions:

1. **Create Policy**
   - In IAM, go to "Policies"
   - Click "Create policy"
   - Click "JSON" tab
   - Paste this (replace `YOUR-BUCKET-NAME`):

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

2. **Name and Create**
   - Name: `S3ProfileImageUpload`
   - Click "Create policy"
   - Attach this policy to your IAM user instead of `AmazonS3FullAccess`

## Step 5: Update Your .env File

Add these variables to your `.env` file in the `my-app` directory:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID="your-access-key-id-here"
AWS_SECRET_ACCESS_KEY="your-secret-access-key-here"
AWS_S3_BUCKET="your-bucket-name"
AWS_S3_REGION="us-east-1"
```

**Replace:**
- `your-access-key-id-here` with your Access Key ID from Step 3
- `your-secret-access-key-here` with your Secret Access Key from Step 3
- `your-bucket-name` with your S3 bucket name from Step 1
- `us-east-1` with your bucket's region if different

## Step 6: Test the Setup

1. **Restart your dev server** (if running)
2. **Try uploading a profile image**
3. **Check the browser console** for any errors
4. **Verify in S3**: Go to your bucket in AWS Console and check if the image was uploaded

## Troubleshooting

### CORS Errors
- Make sure CORS is configured correctly (Step 2)
- Check that your origin (localhost:3000) is in the AllowedOrigins list
- Clear browser cache and try again

### Access Denied Errors
- Verify IAM user has correct permissions
- Check that bucket name in .env matches your actual bucket name
- Ensure Access Key ID and Secret Access Key are correct

### Bucket Not Found
- Verify bucket name is correct (case-sensitive)
- Check that region matches your bucket's region

## Security Best Practices

1. **Never commit .env file** to git (already in .gitignore)
2. **Use IAM roles** in production (instead of access keys)
3. **Restrict bucket permissions** to only what's needed
4. **Enable bucket versioning** for production
5. **Set up lifecycle policies** to delete old images
6. **Use CloudFront** for CDN in production

## Cost Estimate

- **Free Tier**: 5GB storage, 20,000 GET requests, 2,000 PUT requests per month
- **After Free Tier**: ~$0.023 per GB storage, $0.005 per 1,000 requests
- For a small app, you'll likely stay within free tier limits

