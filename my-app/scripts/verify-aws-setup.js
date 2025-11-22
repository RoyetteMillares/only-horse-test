/**
 * AWS S3 Setup Verification Script
 * Run with: node scripts/verify-aws-setup.js
 * — Royette
 */

require('dotenv').config({ path: '.env' })

const { S3Client, ListBucketsCommand, HeadBucketCommand } = require('@aws-sdk/client-s3')

async function verifyAWSSetup() {
  console.log('roy: Verifying AWS S3 configuration...\n')

  // Check environment variables
  const requiredVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET',
    'AWS_S3_REGION'
  ]

  const missing = requiredVars.filter(v => !process.env[v] || process.env[v].includes('your-'))
  
  if (missing.length > 0) {
    console.error('❌ Missing or placeholder environment variables:')
    missing.forEach(v => console.error(`   - ${v}`))
    console.error('\nPlease update your .env file with actual AWS credentials.')
    process.exit(1)
  }

  console.log('✅ All environment variables are set\n')

  // Test S3 connection
  try {
    const s3Client = new S3Client({
      region: process.env.AWS_S3_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })

    console.log('roy: Testing S3 connection...')
    
    // List buckets to verify credentials
    const listCommand = new ListBucketsCommand({})
    const response = await s3Client.send(listCommand)
    
    console.log('✅ Successfully connected to AWS S3')
    console.log(`   Found ${response.Buckets.length} bucket(s)\n`)

    // Check if specified bucket exists
    console.log(`roy: Checking if bucket "${process.env.AWS_S3_BUCKET}" exists...`)
    const headCommand = new HeadBucketCommand({
      Bucket: process.env.AWS_S3_BUCKET,
    })

    try {
      await s3Client.send(headCommand)
      console.log(`✅ Bucket "${process.env.AWS_S3_BUCKET}" exists and is accessible\n`)
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        console.error(`❌ Bucket "${process.env.AWS_S3_BUCKET}" not found`)
        console.error('   Please check the bucket name in your .env file')
      } else if (error.name === 'Forbidden' || error.$metadata?.httpStatusCode === 403) {
        console.error(`❌ Access denied to bucket "${process.env.AWS_S3_BUCKET}"`)
        console.error('   Please check your IAM user permissions')
      } else {
        console.error(`❌ Error accessing bucket: ${error.message}`)
      }
      process.exit(1)
    }

    console.log('🎉 AWS S3 setup is correct!')
    console.log('\nConfiguration:')
    console.log(`   Bucket: ${process.env.AWS_S3_BUCKET}`)
    console.log(`   Region: ${process.env.AWS_S3_REGION}`)
    console.log(`   Access Key: ${process.env.AWS_ACCESS_KEY_ID.substring(0, 8)}...`)

  } catch (error) {
    console.error('❌ Failed to connect to AWS S3:')
    console.error(`   ${error.message}`)
    
    if (error.name === 'InvalidAccessKeyId') {
      console.error('\n   Your Access Key ID is invalid. Please check your .env file.')
    } else if (error.name === 'SignatureDoesNotMatch') {
      console.error('\n   Your Secret Access Key is incorrect. Please check your .env file.')
    } else if (error.name === 'CredentialsProviderError') {
      console.error('\n   Failed to load credentials. Please check your .env file.')
    }
    
    process.exit(1)
  }
}

verifyAWSSetup().catch(console.error)

