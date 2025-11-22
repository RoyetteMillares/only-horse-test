import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const emailTemplates = {
  verifyEmail: (name: string, verificationUrl: string) => ({
    subject: 'Verify your email address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Companion App, ${name}!</h2>
        <p>Please verify your email address to get started.</p>
        <p>
          <a href="${verificationUrl}" style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
        </p>
        <p>Or copy this link: <code>${verificationUrl}</code></p>
        <p style="color: #666; font-size: 12px;">This link expires in 24 hours.</p>
      </div>
    `,
  }),
  
  kycSubmitted: (name: string) => ({
    subject: 'KYC Verification Submitted',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>KYC Submission Received, ${name}</h2>
        <p>Thank you for submitting your identity verification documents.</p>
        <p>We'll review your submission within 24-48 hours and notify you of the status.</p>
        <p style="color: #666; font-size: 12px;">
          If you have questions, contact support@companion.app
        </p>
      </div>
    `,
  }),
  
  kycApproved: (name: string) => ({
    subject: '✓ KYC Verified - Start Earning!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Congratulations ${name}!</h2>
        <p>Your identity has been verified. You're now able to:</p>
        <ul>
          <li>Be visible to subscribers</li>
          <li>Accept subscriptions</li>
          <li>Earn money</li>
          <li>Chat with subscribers</li>
        </ul>
        <p>Start building your audience today!</p>
      </div>
    `,
  }),
  
  kycRejected: (name: string, reason: string) => ({
    subject: 'KYC Verification Status',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${name}, Your KYC Verification</h2>
        <p>Unfortunately, your verification couldn't be approved.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>You can try again with clearer documents.</p>
      </div>
    `,
  }),
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationUrl: string
) {
  try {
    const result = await resend.emails.send({
      from: 'noreply@companion.app',
      to: email,
      ...emailTemplates.verifyEmail(name, verificationUrl),
    })
    return result
  } catch (error) {
    console.error('Failed to send verification email:', error)
    throw error
  }
}

export async function sendKycSubmittedEmail(email: string, name: string) {
  try {
    const result = await resend.emails.send({
      from: 'noreply@companion.app',
      to: email,
      ...emailTemplates.kycSubmitted(name),
    })
    return result
  } catch (error) {
    console.error('Failed to send KYC email:', error)
    throw error
  }
}

export async function sendKycApprovedEmail(email: string, name: string) {
  try {
    const result = await resend.emails.send({
      from: 'noreply@companion.app',
      to: email,
      ...emailTemplates.kycApproved(name),
    })
    return result
  } catch (error) {
    console.error('Failed to send KYC approval email:', error)
    throw error
  }
}

export async function sendKycRejectedEmail(
  email: string,
  name: string,
  reason: string
) {
  try {
    const result = await resend.emails.send({
      from: 'noreply@companion.app',
      to: email,
      ...emailTemplates.kycRejected(name, reason),
    })
    return result
  } catch (error) {
    console.error('Failed to send KYC rejection email:', error)
    throw error
  }
}
