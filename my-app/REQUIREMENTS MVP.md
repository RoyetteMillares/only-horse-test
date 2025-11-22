# Creator Platform MVP: Complete Requirements Specification

## Executive Summary

This document outlines the complete technical and functional requirements for building a hybrid "OnlyFans + Rental Girlfriend Service" platform using Next.js 16, TypeScript, Tailwind CSS, Shadcn UI, NextAuth, Prisma, PostgreSQL, Resend, AWS S3, and Google/Facebook OAuth.

**Target Timeline:** 8-12 weeks

**Target Users:** Fans (Clients), Creators (Cast Members), Admin

---

## 1. Technology Stack (Non-Negotiable)

### Frontend
- **Framework:** Next.js 16 with App Router
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI (pre-built, customizable components)
- **Language:** TypeScript (strict mode)
- **Rendering:** SSR (Server-Side Rendering) via Next.js - NO external fetch libraries

### Backend
- **Runtime:** Node.js (via Next.js Server Actions)
- **Database:** PostgreSQL (managed service or self-hosted)
- **ORM:** Prisma
- **Authentication:** NextAuth v5 (with Prisma Adapter)
- **Auth Providers:** Google OAuth, Facebook OAuth

### Third-Party Services
- **Email:** Resend (transactional emails - signup verification, booking notifications)
- **AWS S3:** Media storage (profile images, locked content, video uploads)
- **Payments:** Stripe Connect (creator payouts, platform fee split)
- **Hosting:** Vercel (optimal for Next.js)

### Development Tools
- **Package Manager:** npm or pnpm
- **Version Control:** Git/GitHub
- **Database Client:** Prisma Studio (visual schema explorer)

---

## 2. Database Schema (Prisma Models)

### 2.1 User Model
- id (UUID/CUID)
- name (String, nullable)
- email (String, unique)
- emailVerified (DateTime, nullable)
- image (String, nullable)
- role (Enum: FAN | CREATOR)
- createdAt (DateTime)
- updatedAt (DateTime)

**Creator-Specific Fields:**
- bio (String, nullable)
- hourlyRate (Int, nullable) - Price per hour in JPY/USD cents
- minHours (Int, default: 2) - Minimum booking duration
- location (String, nullable) - Primary meeting city (e.g., "Tokyo")
- noGoZones (String, nullable) - JSON list of prohibited areas
- kycApproved (Boolean, default: false) - KYC verification status
- stripConnectId (String, nullable) - Stripe Connect account ID
- averageRating (Float, nullable) - Aggregated review score

**Relations:**
- accounts (Account[], NextAuth)
- posts (Post[])
- creatorBookings (Booking[], @relation("CreatorBookings"))
- clientBookings (Booking[], @relation("ClientBookings"))
- creatorSubscriptions (Subscription[], @relation("CreatorSubs"))
- fanSubscriptions (Subscription[], @relation("FanSubs"))
- reviews (Review[])
- chats (Chat[])

### 2.2 Account Model (NextAuth)
- userId (String, FK to User)
- type (String)
- provider (String)
- providerAccountId (String)
- refresh_token (String, nullable)
- access_token (String, nullable)
- expires_at (Int, nullable)
- token_type (String, nullable)
- scope (String, nullable)
- id_token (String, nullable)
- session_state (String, nullable)

**Composite Key:** [provider, providerAccountId]

### 2.3 Post Model
- id (UUID/CUID)
- content (String, nullable) - Caption text
- mediaUrl (String) - S3 URL
- mediaType (Enum: IMAGE | VIDEO)
- duration (Int, nullable) - Video duration in seconds
- isLocked (Boolean, default: true) - Subscription required to view
- creatorId (String, FK to User)
- likeCount (Int, default: 0)
- commentCount (Int, default: 0)
- createdAt (DateTime)
- updatedAt (DateTime)

**Relations:**
- creator (User)
- comments (Comment[])
- likes (Like[])

### 2.4 Subscription Model
- id (UUID/CUID)
- creatorId (String, FK to User)
- fanId (String, FK to User)
- plan (Enum: MONTHLY | YEARLY)
- priceInCents (Int) - Captured at subscription time
- stripePriceId (String, nullable)
- stripeSubscriptionId (String, nullable)
- status (Enum: ACTIVE | CANCELLED | EXPIRED)
- expiresAt (DateTime)
- createdAt (DateTime)
- updatedAt (DateTime)

**Relations:**
- creator (User, @relation("CreatorSubs"))
- fan (User, @relation("FanSubs"))
- Unique Constraint: [creatorId, fanId] (one subscription per creator-fan pair)

### 2.5 Booking Model (The "Twist")
- id (UUID/CUID)
- creatorId (String, FK to User)
- clientId (String, FK to User)
- startTime (DateTime)
- endTime (DateTime)
- durationHours (Int, computed)
- totalPriceInCents (Int) - Captured at booking request time
- status (Enum: PENDING | APPROVED | REJECTED | COMPLETED | CANCELLED)
- meetingLocation (String) - Public location (e.g., "Shibuya Crossing")
- notes (String, nullable) - Initial message from client
- createdAt (DateTime)
- updatedAt (DateTime)

**Relations:**
- creator (User, @relation("CreatorBookings"))
- client (User, @relation("ClientBookings"))
- chats (Chat[], @relation("BookingChats")) - Messages only between these two during active booking
- reviews (Review[]) - Reviews submitted after COMPLETED status

### 2.6 Chat Model
- id (UUID/CUID)
- bookingId (String, FK to Booking)
- senderId (String, FK to User)
- recipientId (String, FK to User)
- message (String)
- isRead (Boolean, default: false)
- createdAt (DateTime)

**Relations:**
- booking (Booking)
- sender (User)
- recipient (User)
- Index: bookingId (for fast lookups during active bookings)

### 2.7 Review Model
- id (UUID/CUID)
- bookingId (String, FK to Booking, unique)
- creatorId (String, FK to User)
- clientId (String, FK to User)
- rating (Int) - 1 to 5 stars
- comment (String, nullable)
- createdAt (DateTime)

**Relations:**
- booking (Booking)
- creator (User)
- client (User)

### 2.8 Additional Models (Comments, Likes)
Comment:
- id, postId, userId, content, createdAt

Like:
- id, postId, userId, createdAt
- Unique Constraint: [postId, userId]

---

## 3. Authentication & Authorization

### 3.1 NextAuth Configuration
- **Providers:** Google OAuth 2.0, Facebook Login, Email (Resend Magic Link - optional fallback)
- **Session Strategy:** JWT (stateless) or Database Sessions (persistent)
- **Adapter:** Prisma Adapter (auto-creates User on first login)
- **Callbacks:**
  - `session()`: Attach `user.role` to session object
  - `signIn()`: Reject users if KYC not approved (for creators)
  - `redirect()`: Route fans to `/dashboard/feed`, creators to `/creator/dashboard`

### 3.2 Role-Based Access Control (RBAC)
- **Public Routes:** `/`, `/creator/[id]` (public profile)
- **Fan-Only Routes:** `/dashboard/feed`, `/dashboard/bookings`, `/dashboard/subscriptions`
- **Creator-Only Routes:** `/creator/dashboard`, `/creator/analytics`, `/creator/settings`
- **Admin-Only Routes:** `/admin/moderation`, `/admin/users`

### 3.3 Middleware (Next.js)
Protect routes using Next.js Middleware:
- Redirect unauthenticated users to login
- Redirect fans trying to access creator routes
- Check subscription status before serving locked content

---

## 4. Core Features (Detailed)

### 4.1 Onboarding Flow

#### A. Fan Onboarding (5 mins)
1. **Landing Page:** CTA buttons "Sign Up as Fan" vs "Sign Up as Creator"
2. **OAuth Login:** Google/Facebook login popup
3. **Profile Setup:** 
   - Nickname (required)
   - Avatar (optional, upload to S3)
   - Email verification via Resend (if not auto-verified by OAuth)
4. **Payment Method:** Add Stripe card (optional for free browsing, required to subscribe)
5. **Onboarding Complete:** Redirect to `/dashboard/feed`

#### B. Creator Onboarding (15 mins)
1. **OAuth Login:** Same as fan
2. **Creator Application Form:**
   - Display Name (public)
   - Bio (max 500 chars)
   - Profile Image (S3 upload)
   - Hourly Rate (JPY/USD)
   - Minimum Booking Duration (default 2 hours)
   - Primary Location (Tokyo, Osaka, Kyoto, etc.)
   - No-Go Zones (e.g., "Shinjuku after 10pm")
3. **KYC Verification:**
   - Upload government ID (S3 upload to private bucket)
   - Admin reviews and approves (can take 24-48 hours)
   - Email notification via Resend on approval
4. **Stripe Connect Setup:**
   - Creators are prompted to link Stripe account
   - Platform takes 15% fee; creator receives 85%
5. **Onboarding Complete:** Redirect to `/creator/dashboard`

### 4.2 Content Discovery & Subscription (OnlyFans Layer)

#### A. Feed Page (`/dashboard/feed`)
- **Infinite Scroll:** Server Component fetches posts in batches of 20
- **Post Card Display:**
  - Creator avatar + name
  - Post media (image/video)
  - Caption text
  - If LOCKED & not subscribed: "Subscribe to Unlock" button
  - If LOCKED & subscribed: Full media display + Like/Comment buttons
  - "Book a Date" CTA button visible on every post
- **Filter/Sort:**
  - "Following" (subscribed creators)
  - "Trending" (most likes)
  - "New" (most recent)

#### B. Creator Profile Page (`/creator/[id]`)
- **Public Profile Section:**
  - Avatar, display name, bio
  - Hourly rate, minimum hours, location
  - Average rating (stars)
  - "Subscribe" button
  - "Book a Date" button (prominent)
- **Content Grid:**
  - Display first 3-5 posts (thumbnails)
  - Locked posts show lock icon + "Subscribe to view"
  - Subscribed fans see all posts
- **Reviews Section:**
  - Show last 5 reviews with ratings
  - Only reviews from verified completed bookings

#### C. Subscription Models
- **Monthly Tier:** $9.99/month (recurring, auto-renew)
- **Yearly Tier:** $89.99/year (discount incentive)
- **Payment Processing:** Stripe Billing (server-side via Server Actions)
- **Subscription States:**
  - ACTIVE: Fan can view locked content
  - EXPIRED: Redirect to re-subscribe
  - CANCELLED: Fan loses access to future content (but can renew)

### 4.3 The Booking System (The "Twist")

#### A. Booking Request Flow (Fan Perspective)
1. **Initiate:** Click "Book a Date" on Creator Profile or Post
2. **Modal Dialog Opens:**
   - Date Picker (disable past dates, disable creator's blocked dates)
   - Time Picker (e.g., 2:00 PM)
   - Duration Selector (minimum = `creator.minHours`, max = 8 hours)
   - Meeting Location (dropdown of common areas or text input)
   - Notes/Message (optional, max 500 chars)
   - Code of Conduct Checkbox: "I agree this is a non-sexual, public service"
   - Price Display: `durationHours × creator.hourlyRate`
3. **Submit:**
   - Server Action `requestDate()` validates and creates Booking record
   - Status set to PENDING
   - Stripe pre-authorizes (but doesn't capture) payment
   - Email sent to Creator via Resend: "New Date Request from [Fan Name]"

#### B. Booking Request Flow (Creator Perspective)
1. **View Requests:** Creator Dashboard tab "Pending Requests"
   - Show card: Fan name, Fan rating, Requested date/time, location, duration, price
2. **Actions:**
   - "Approve" → Status = APPROVED, Email sent to fan, Chat channel opens
   - "Decline" → Status = REJECTED, Pre-auth released, Email sent to fan
3. **No Manual Acceptance = Auto-Reject** after 48 hours (configurable)

#### C. Chat Coordination (24-Hour Window)
- After approval, both parties can message within booking's chat thread
- Chat accessible in `/dashboard/bookings/[id]/chat`
- Messages are plain text only (no file uploads to prevent contact exchange)
- Chat closes after the booking `endTime` is reached

#### D. Booking Execution & Completion
- **Day Of:** Timer shows "Meeting starts in X minutes"
- **Post-Meeting:** Both parties mark "Completed"
- **Review:** 
  - Fan rates Creator (1-5 stars, optional comment)
  - Creator rates Fan (1-5 stars, optional comment)
  - Reviews visible on profiles after both submit
- **Payment Capture:** Stripe captures the pre-authorized amount
- **Creator Payout:** Automatic transfer to Stripe Connect account (daily or weekly, configurable)

### 4.4 Media Upload & S3 Integration

#### A. Upload Flow (Creator Posting Content)
1. **New Post Form:** Creator clicks "Create Post"
2. **Modal with:**
   - File picker (image or video)
   - Caption text area
   - Lock toggle ("This is subscriber-only")
   - Preview of media
3. **Upload Process:**
   - Server Action `getUploadUrl()` generates Presigned S3 URL (60-sec expiry)
   - Client-side JavaScript uploads directly to S3
   - On success, Server Action `createPost()` saves Post record with S3 URL
4. **Validation:**
   - Max file size: 100MB (videos), 10MB (images)
   - Allowed formats: JPEG, PNG, MP4, MOV

#### B. S3 Bucket Structure
s3://yourbucket/
  uploads/
    posts/[userId]/[postId].[ext]
    profiles/[userId]/[avatar].[ext]
    kyc/[userId]/[timestamp].[ext]  (private, admin-only)

### 4.5 Email Notifications (Resend)

**Transactional Emails Sent Via Server Actions:**
- **Signup Verification:** "Verify your email" link (if OAuth email not auto-verified)
- **Creator KYC Approved:** "Your account is now live!"
- **New Booking Request:** "New date request from [Fan Name]"
- **Booking Approved:** "Your request was approved! Chat opens now."
- **Booking Rejected:** "Your request was declined. Try another time."
- **Subscription Renewed:** "Your subscription to [Creator] is active for 30 days"
- **Subscription Expiring:** "Your subscription expires in 3 days. Renew now."
- **Post Published:** "[Creator] posted new content"
- **New Review:** "You received a 5-star review from [Fan Name]"

---

## 5. Admin Dashboard (Post-MVP Priority)

### 5.1 Moderation Tools
- **User Management:** List all creators/fans, search, filter by status
- **KYC Verification:** Queue of pending KYC uploads, approve/reject with notes
- **Booking Flagging:** View flagged bookings (e.g., reports of ToS violations)
- **Content Moderation:** List reported posts, approve/remove
- **Ban System:** Ban users violating safety guidelines, refund pending bookings

### 5.2 Analytics Dashboard
- **Revenue:** Total GMV, platform fees collected, creator payouts
- **User Growth:** Monthly user signups (fan vs. creator)
- **Booking Metrics:** Total bookings, avg booking duration, approval rate
- **Content:** Total posts, avg engagement (likes/comments)

---

## 6. Safety & Compliance

### 6.1 Code of Conduct
**Hard Rule:** "This platform is for non-sexual, public companionship only. No private rooms, no touching, no illegal activity."
- Embedded as mandatory checkbox during booking confirmation
- Violators are banned on first offense (no appeals initially)

### 6.2 Data Security
- **PII Protection:** ID uploads stored in private S3 bucket, never shown to users
- **Passwords:** Handled by NextAuth (bcrypt hashing)
- **Stripe:** PCI compliance built-in (card data never touches our servers)
- **HTTPS:** Enforced via Vercel

### 6.3 Payment Security
- **Pre-Authorization:** Stripe pre-authorizes payment at booking request (not captured until completed)
- **Refunds:** Auto-refund if booking rejected or cancelled by creator
- **Chargebacks:** Document all chat/booking history to dispute false claims

---

## 7. File Structure (Next.js 16 App Router)

creator-platform/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx           # Landing page
│   │   │   └── creator/
│   │   │       └── [id]/
│   │   │           └── page.tsx   # Public creator profile
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── verify/page.tsx    # Email verification
│   │   ├── (dashboard)/
│   │   │   ├── feed/page.tsx
│   │   │   ├── bookings/
│   │   │   │   ├── page.tsx       # List of bookings
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx   # Booking detail
│   │   │   │       └── chat.tsx   # Chat component
│   │   │   ├── subscriptions/page.tsx
│   │   │   └── profile/page.tsx
│   │   ├── creator/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   └── posts/
│   │   │       └── new/page.tsx
│   │   ├── admin/
│   │   │   ├── moderation/page.tsx
│   │   │   ├── users/page.tsx
│   │   │   └── analytics/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── webhooks/
│   │   │   │   ├── stripe/route.ts
│   │   │   │   └── resend/route.ts
│   │   │   └── health/route.ts
│   │   └── layout.tsx             # Root layout
│   ├── components/
│   │   ├── ui/                    # Shadcn components
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── PostCard.tsx
│   │   ├── BookingModal.tsx
│   │   ├── ChatWindow.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── prisma.ts              # Prisma client instance
│   │   ├── auth.ts                # NextAuth config export
│   │   ├── s3.ts                  # S3 client & helpers
│   │   ├── stripe.ts              # Stripe client
│   │   ├── resend.ts              # Resend client
│   │   └── utils.ts               # Helpers
│   ├── actions/
│   │   ├── auth.ts                # Sign in/out actions
│   │   ├── posts.ts               # Create/delete posts
│   │   ├── subscriptions.ts       # Subscribe/cancel
│   │   ├── bookings.ts            # Request/approve/reject/complete
│   │   ├── s3.ts                  # S3 upload URL generation
│   │   ├── chats.ts               # Send/fetch messages
│   │   └── reviews.ts             # Create reviews
│   ├── hooks/
│   │   ├── useAuth.ts             # Session hook
│   │   ├── useBooking.ts
│   │   └── ...
│   ├── types/
│   │   └── index.ts               # TypeScript interfaces
│   └── env.ts                     # Environment variable validation
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── migrations/
├── .env.local                     # Local env (secrets)
├── .env.example                   # Public template
├── next.config.ts                 # Next.js configuration
├── tailwind.config.ts             # Tailwind setup
├── tsconfig.json
├── package.json
└── README.md

---

## 8. Environment Variables (.env.local)

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/creator_platform

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

# OAuth Providers
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
FACEBOOK_APP_ID=<from Facebook Developers>
FACEBOOK_APP_SECRET=<from Facebook Developers>

# Email (Resend)
RESEND_API_KEY=<from Resend dashboard>
RESEND_FROM_EMAIL=noreply@yourdomain.com

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<IAM user key>
AWS_SECRET_ACCESS_KEY=<IAM user secret>
AWS_S3_BUCKET=your-bucket-name

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App Config
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_PLATFORM_FEE_PERCENT=15
NEXT_PUBLIC_MIN_BOOKING_HOURS=2

---

## 9. API Routes & Server Actions

### 9.1 Authentication Endpoints
- `POST /api/auth/signin` → NextAuth login
- `POST /api/auth/signout` → NextAuth logout
- `POST /api/auth/callback/[provider]` → OAuth callback (auto-handled by NextAuth)

### 9.2 Server Actions (Mutations)
- `actions/auth.ts`:
  - `signUp()`, `signIn()`, `signOut()`
- `actions/posts.ts`:
  - `createPost(formData)` → Save to DB, upload to S3
  - `deletePost(postId)` → Remove from DB & S3
  - `likePost(postId)` → Add/remove like
  - `commentOnPost(postId, text)` → Create comment
- `actions/bookings.ts`:
  - `requestDate(formData)` → Create booking, pre-auth payment
  - `approveBooking(bookingId)` → Update status, open chat
  - `rejectBooking(bookingId)` → Update status, release pre-auth
  - `completeBooking(bookingId)` → Finalize, capture payment
  - `submitReview(bookingId, rating, comment)` → Save review
- `actions/subscriptions.ts`:
  - `subscribe(creatorId, plan)` → Create subscription, charge card
  - `cancelSubscription(subscriptionId)` → Stop recurring
- `actions/chats.ts`:
  - `sendMessage(bookingId, message)` → Store in DB
  - `fetchMessages(bookingId)` → Paginate messages
- `actions/s3.ts`:
  - `getUploadUrl(fileType)` → Generate Presigned URL

### 9.3 Webhook Endpoints
- `POST /api/webhooks/stripe` → Handle Stripe events (charge success, refund, etc.)
- `POST /api/webhooks/resend` → Handle bounce/complaint emails (optional)

---

## 10. UI Components (Shadcn)

**Install via `npx shadcn-ui@latest add`:**
- Button
- Card
- Dialog
- Input
- Textarea
- Select
- Checkbox
- Avatar
- Badge
- Tabs
- Calendar (for booking date picker)
- Popover
- Toast (for notifications)
- Skeleton (for loading states)

---

## 11. Performance & Optimization

### 11.1 Caching Strategy
- **ISR (Incremental Static Regeneration):** Creator profiles revalidate every 1 hour
- **Server Components:** Feed posts fetched server-side (no hydration lag)
- **Image Optimization:** Use `next/image` with S3 URL; set width/height constraints
- **Database Query Optimization:**
  - Index on `creatorId`, `clientId` for Booking table
  - Index on `userId` for Post table

### 11.2 Database Connection Pooling
- Use Prisma with connection pooling (PgBouncer recommended)
- Max connections: 20-50 (adjust based on load)

---

## 12. Testing Strategy

### 12.1 Unit Tests
- Test Server Actions (e.g., `requestDate()` validation logic)
- Use Jest + `@testing-library/react`

### 12.2 Integration Tests
- Test booking workflow end-to-end (request → approve → complete)
- Test payment flow with Stripe test mode

### 12.3 Manual QA Checklist
- ✓ OAuth login flow (Google & Facebook)
- ✓ Creator KYC upload and admin approval
- ✓ Fan subscribes and views locked content
- ✓ Fan requests booking, creator approves, chat opens
- ✓ Payment is pre-authorized, then captured after completion
- ✓ Emails sent correctly via Resend
- ✓ Media uploads to S3 and displays correctly
- ✓ Reviews saved after booking completion

---

## 13. Deployment Checklist

### Pre-Launch
- [ ] Set `NODE_ENV=production`
- [ ] Generate `NEXTAUTH_SECRET` securely
- [ ] Configure Stripe production keys (not test keys)
- [ ] Configure AWS IAM user with S3 & KMS access (not root account)
- [ ] Configure Resend production API key
- [ ] Database backup strategy in place
- [ ] SSL certificate installed (Vercel auto-handles)
- [ ] Security headers configured (Content-Security-Policy, etc.)

### Post-Launch Monitoring
- [ ] Sentry for error tracking
- [ ] Vercel Analytics for performance
- [ ] LogRocket for session replay (user behavior debugging)
- [ ] Stripe Dashboard for payment health

---

## 14. Post-MVP Features (Roadmap)

### Phase 2 (Weeks 13-24)
- **In-App Notifications:** WebSocket-based real-time chat (replace polling)
- **Creator Analytics:** Dashboard showing earnings, booking trends, subscriber growth
- **Messaging Premium:** Verify phone numbers to unlock private messaging
- **Booking Reminders:** SMS/Push notifications 24 hours before booking
- **Referral Program:** Earn credits for inviting friends
- **Gift Subscriptions:** Buy a subscription for another fan

### Phase 3 (Weeks 25+)
- **Live Streaming:** RTMP stream integration (e.g., via Mux or AWS IVS)
- **Fan Tipping:** Send one-time tips on posts/messages
- **Creator Marketplace:** Sell "Experience Packages" (e.g., "Date + Dinner")
- **Crypto Payments:** Accept Solana/Ethereum (based on your interest)
- **Mobile App:** React Native or PWA version
- **International Expansion:** Multi-currency, regional compliance

---

## 15. Legal & Compliance

### 15.1 Terms of Service
- **Service Definition:** "Non-sexual, public companionship service"
- **Prohibited Content:** No explicit content, no solicitation
- **User Responsibility:** Platform not liable for user conduct outside app

### 15.2 Privacy Policy
- **Data Collected:** Email, profile info, payment method (via Stripe)
- **Data Usage:** Service delivery, analytics, abuse prevention
- **GDPR Compliance:** Right to deletion, data portability (if EU users)

### 15.3 Payment Terms
- **Platform Fee:** 15% of booking price + 2.9% + $0.30 (Stripe fee)
- **Creator Payout:** 85% of booking price, net of Stripe fees
- **Tax Responsibility:** Creators responsible for filing as self-employed

---

## 16. Estimated Development Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Setup & Auth** | Weeks 1-2 | Database schema, NextAuth config, OAuth integration |
| **Content Layer** | Weeks 3-4 | Feed UI, subscription logic, S3 uploads |
| **Booking Engine** | Weeks 5-7 | Booking models, request/approve flow, chat, Stripe pre-auth |
| **Admin & Safety** | Weeks 8-9 | Moderation dashboard, KYC verification, ToS enforcement |
| **Testing & Polish** | Weeks 10-12 | QA, performance tuning, security audit, documentation |
| **Launch** | Week 12 | Deploy to production, announce |

---

## 17. Team & Roles

| Role | Responsibilities |
|------|------------------|
| **Full-Stack Dev (You)** | All frontend (React/Next.js), backend (Server Actions), database design |
| **DevOps (Optional)** | Database maintenance, S3 bucket config, Vercel CI/CD, monitoring |
| **Designer (Optional)** | UI/UX refinement, branding, mobile responsiveness |
| **Legal Consultant (Recommended)** | ToS, privacy policy, payment compliance, regional regulations |
| **QA Tester (Post-Launch)** | Manual testing, bug reports, user feedback |

---

## 18. Budget Estimate (Monthly SaaS Costs)

| Service | Cost | Notes |
|---------|------|-------|
| **Vercel** | $20-50 | Pro plan for production |
| **PostgreSQL (AWS RDS)** | $30-100 | `db.t3.medium`, multi-AZ backup |
| **AWS S3** | $5-50 | Depends on media volume |
| **Stripe** | ~2.9% + $0.30/transaction | No monthly fee, per-transaction |
| **Resend** | $20-100 | 5K-50K emails/month |
| **Sentry (Error Tracking)** | $29 | Error monitoring |
| **Total** | ~$100-350/month | Scales with user growth |

**Note:** Costs are minimal at launch; scale horizontally as users increase.

---

## 19. Success Metrics (MVP Launch Goals)

- **User Signups:** 500+ fans, 50+ creators in first month
- **Booking Success Rate:** >70% of requests approved within 48 hours
- **Subscription Conversion:** >10% of fans subscribe to at least one creator
- **Payment Health:** <2% chargeback rate
- **NPS Score:** >40 (Customer satisfaction)
- **Platform Revenue:** $5K-10K GMV in first month

---

## Conclusion

This MVP combines the *content monetization* (OnlyFans) with the *service booking* (Japan's Rental Girlfriend industry), creating a hybrid platform that appeals to both creators seeking recurring revenue and fans seeking exclusive experiences.

The tech stack (Next.js 16, TypeScript, Prisma, PostgreSQL, Stripe) is battle-tested, production-grade, and scales efficiently. By deferring complex features (live streaming, crypto, mobile) to Phase 2, you can launch a *minimal, defensible, secure* MVP in 8-12 weeks with a small team.

**Key Success Factors:**
1. **Clear Safety Guidelines:** ToS enforcement prevents legal liability
2. **Creator Verification (KYC):** Builds user trust
3. **Atomic Transactions:** Server Actions ensure payment consistency
4. **Proactive Moderation:** Ban violators early
5. **Creator Economics:** Ensure 85%+ payout keeps talent happy

Good luck building! 🚀