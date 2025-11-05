Slopster.ai MVP: Battle-Tested Roadmap
Architecture Overview
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                    (Next.js 14 App Router)                       │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ Auth, DB queries, Storage URLs
             │
┌────────────▼────────────────────────────────────────────────────┐
│                         SUPABASE                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐   │
│  │ Auth         │ │ PostgreSQL   │ │ Storage (uploads)    │   │
│  │ (email/OAuth)│ │ (user, jobs, │ │ (pre-signed URLs)    │   │
│  └──────────────┘ │  scripts)    │ └──────────────────────┘   │
│                   └──────────────┘                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Realtime (job progress subscriptions)                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ API calls from Next.js API routes
             │
┌────────────▼────────────────────────────────────────────────────┐
│                      NEXT.JS API ROUTES                          │
│                     (Vercel Serverless)                          │
│                                                                  │
│  /api/scripts/generate  ──────────────► OpenAI GPT-4o          │
│  /api/videos/upload     ──────────────► AWS S3 pre-signed URL  │
│  /api/videos/process    ──────────────► AWS SQS (enqueue job)  │
│  /api/optimizer/analyze ──────────────► OpenAI GPT-4o-mini     │
└─────────────────────────────────────────────────────────────────┘
             │
             │ Job triggers
             │
┌────────────▼────────────────────────────────────────────────────┐
│                         AWS ECOSYSTEM                            │
│                                                                  │
│  ┌────────────┐      ┌────────────────────┐                    │
│  │  S3 Bucket │◄─────│  Lambda Function   │                    │
│  │            │      │  (FFmpeg layer)    │                    │
│  │ - uploads/ │      │                    │                    │
│  │ - outputs/ │      │  • Trim video      │                    │
│  │            │      │  • Add captions    │                    │
│  └────────────┘      │  • Transitions     │                    │
│                      │  • Export MP4      │                    │
│                      └────────▲───────────┘                    │
│                               │                                 │
│                      ┌────────┴───────────┐                    │
│                      │   SQS Queue        │                    │
│                      │ (job messages)     │                    │
│                      └────────────────────┘                    │
│                                                                  │
│  Lambda updates Supabase job status via REST API                │
└──────────────────────────────────────────────────────────────────┘
---

Phased Timeline (12 Weeks)
Phase 1: Foundation (Weeks 1-3)
Goal: Core infrastructure, auth, basic UI

Week 1: Project setup + Supabase + AWS
Monorepo structure (Next.js 14)
Supabase: Auth, DB schema, Storage bucket
AWS: S3 bucket, IAM roles, SQS queue setup
Figma: Wireframes for 4 core screens
Week 2: Authentication + Dashboard
Supabase Auth (email/password + Google OAuth)
Protected routes + middleware
Dashboard shell (empty state → onboarding)
User settings page
Week 3: Database + Project Structure
PostgreSQL schema: users, projects, scripts, videos, jobs
Supabase RLS policies
Project CRUD (create, list, delete)
Success Metrics: User can sign up, log in, create a project

---

Phase 2: AI Script Generator (Weeks 4-5)
Goal: OpenAI-powered script generation

Week 4: Script Generator UI + API
Prompt input form (idea, duration, platform, tone)
OpenAI API wrapper (lib/openai.ts)
Streaming response UI (typewriter effect)
Save script to Supabase
Week 5: Script Editor + Optimization
Editable script blocks (hook, body, CTA)
Token usage tracking + cost guardrails
Script templates (viral hooks library)
Export script as JSON/TXT
Success Metrics: Generate 10 test scripts, avg cost <$0.10/script

---

Phase 3: Video Upload + AWS Pipeline (Weeks 6-7)
Goal: Upload → S3 → Lambda processing

Week 6: Video Upload Flow
Drag-and-drop upload component
S3 pre-signed URLs (secure upload)
Upload progress bar
Video metadata extraction (duration, resolution)
Week 7: Lambda + FFmpeg Processing
Lambda function with FFmpeg layer
SQS queue integration
Job status tracking (queued → processing → completed → failed)
Supabase Realtime for progress updates
Success Metrics: Upload 5min video, process in <2min, receive download link

---

Phase 4: Auto-Edit Features (Weeks 8-9)
Goal: FFmpeg operations (trim, captions, transitions)

Week 8: Basic Editing
Trim video (start/end timestamps)
Auto-captions (Whisper API or hardcoded SRT)
Video format conversion (MP4, 1080p, 9:16 aspect ratio)
Week 9: Transitions + Overlays
Simple transitions (fade, cut)
Text overlays (title, CTA)
Audio normalization
Quality presets (TikTok, Reels, Shorts)
Success Metrics: Process 1-hour video in <10min, output <100MB

---

Phase 5: Virality Optimizer (Week 10)
Goal: AI-powered scoring + metadata suggestions

Week 10: Optimizer Engine
OpenAI prompt: Analyze script/video for virality
Score (1-10) with breakdown (hook strength, pacing, CTA)
Hashtag suggestions (platform-specific)
Posting time recommendations
Sound/music suggestions (text-based, no audio analysis MVP)
Success Metrics: Generate optimizer report in <5s, cost <$0.05/report

---

Phase 6: Export + Polish (Weeks 11-12)
Goal: Download, UX polish, onboarding

Week 11: Export Flow
Download MP4 from S3 (pre-signed URL)
Metadata export (JSON: title, description, tags, posting times)
Export history (past videos)
Webhook for job completion (email notification)
Week 12: Launch Prep
Onboarding flow (3-step wizard)
Error handling + user feedback (toasts, modals)
Mobile-responsive UI polish
Analytics setup (PostHog or Mixpanel free tier)
Landing page (waitlist → dashboard)
Success Metrics: Complete end-to-end flow in <15min, 0 critical bugs

---

Feature Priority Matrix
Must-Have (Blocks Launch)
✅ Email/password + Google Auth
✅ AI script generation (OpenAI GPT-4o)
✅ Video upload to S3
✅ Async processing (Lambda + SQS + FFmpeg)
✅ Basic trim + captions
✅ Export MP4 + metadata
✅ Virality optimizer (AI scoring)
✅ Realtime job progress
Nice-to-Have (Post-MVP)
🔲 B-roll suggestions (Pexels API)
🔲 Advanced transitions (wipes, zooms)
🔲 Audio analysis (volume, silence detection)
🔲 Multi-video projects
🔲 Team collaboration
🔲 Direct TikTok/YouTube API upload
🔲 Custom branding (watermarks, intros)
---

API Cost Estimates (Monthly)
OpenAI API
Script Generation: GPT-4o @ $2.50 per 1M input tokens
Avg script: 500 input + 1500 output tokens = $0.02/script
100 scripts/month = $2
Virality Optimizer: GPT-4o-mini @ $0.15 per 1M input tokens
Avg analysis: 1000 input + 500 output tokens = $0.001/analysis
100 analyses/month = $0.10
Total OpenAI: $2.10/month

AWS (Free Tier Covered for MVP)
S3 Storage: $0.023/GB
50GB storage (50 videos @ 1GB each) = $1.15
Free tier: 5GB/month → $1.03 paid
S3 Data Transfer: $0.09/GB (egress)
50 downloads (50GB) = $4.50
Free tier: 100GB/month → $0 paid
Lambda Invocations: $0.20 per 1M requests
100 jobs/month = $0.000002 (covered by free tier)
Lambda Compute: $0.0000166667 per GB-second
Avg 5min video processing @ 1GB memory = $0.005/job
100 jobs = $0.50
Free tier: 400,000 GB-seconds → $0 paid
SQS Requests: $0.40 per 1M requests
200 requests (enqueue + dequeue) = $0.00008 (covered by free tier)
Total AWS: ~$1-2/month (mostly free tier)

Supabase
Free tier: 500MB storage, 2GB egress, 500MB database
Storage: User data, job metadata (not videos) = $0
Database: <10MB = $0
Auth: Unlimited = $0
Total Supabase: $0/month

Vercel
Hobby (free): 100GB bandwidth, 100 serverless executions/day
Frontend: ~5GB/month = $0
API routes: <1000/day = $0
Total Vercel: $0/month

---

GRAND TOTAL: ~$5-10/month for MVP (well under $200 budget)

---

Risks & Mitigation
Risk 1: Video Processing Latency (1-2 hour videos)
Impact: High (user experience)

Mitigation:

SQS + async processing (no timeout limits)
Progress bar with ETA (Lambda updates job status every 10%)
Email notification on completion
Set expectations: "Processing time: ~10-20min for 1-hour video"
Risk 2: AWS Lambda Cold Starts
Impact: Medium (first job takes 10-30s to start)

Mitigation:

Provision concurrency (1 warm Lambda = $13/month, skip for MVP)
Show "Initializing..." status in UI
SQS FIFO queue (ordered processing)
Risk 3: OpenAI Rate Limits
Impact: Medium (500 RPM on free tier)

Mitigation:

Implement client-side debouncing (1 request/5s)
Retry logic with exponential backoff
Cache common script templates
Upgrade to Tier 1+ ($5 prepaid = 5000 RPM)
Risk 4: Supabase Storage Limits (5GB free)
Impact: Low (videos stored in S3, not Supabase)

Mitigation:

Only store user uploads temporarily in Supabase (optional)
Use S3 as primary video storage
Auto-delete uploads >30 days old
Risk 5: Auth Edge Cases (OAuth redirect loops)
Impact: Medium (user can't log in)

Mitigation:

Test Google OAuth in production (not just localhost)
Set up proper callback URLs in Supabase dashboard
Fallback to email magic links if OAuth fails
Risk 6: FFmpeg Memory Limits (Lambda 10GB max)
Impact: High (4K videos may exceed memory)

Mitigation:

Limit uploads to 1080p max (reject 4K in UI)
Use streaming FFmpeg (process in chunks)
Upgrade Lambda to 3GB memory (sufficient for 2-hour 1080p)
---

Success Metrics Per Phase
Phase 1 (Weeks 1-3): Foundation
✅ User can sign up with email + Google
✅ User sees empty dashboard
✅ User creates first project
Phase 2 (Weeks 4-5): AI Scripts
✅ Generate script in <10s
✅ Cost per script <$0.10
✅ Edit and save script
Phase 3 (Weeks 6-7): Video Upload
✅ Upload 5min video successfully
✅ Job queued in SQS
✅ Lambda processes video
✅ Realtime status updates work
Phase 4 (Weeks 8-9): Auto-Edit
✅ Trim video accurately
✅ Generate captions (hardcoded or Whisper)
✅ Apply transitions
✅ Export 1080p MP4
Phase 5 (Week 10): Optimizer
✅ AI virality score (1-10)
✅ Hashtag suggestions (5+)
✅ Posting time recommendations
Phase 6 (Weeks 11-12): Export + Polish
✅ Download MP4 + metadata
✅ Onboarding flow complete
✅ Mobile-responsive
✅ 0 critical bugs in core flow
---

Cursor-Ready Bootstrap Plan
Monorepo Structure
slopster-ai/
├── .env.local                    # Supabase + OpenAI + AWS keys
├── .gitignore
├── README.md
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── app/
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── callback/page.tsx    # OAuth redirect
│   ├── (dashboard)/
│   │   ├── layout.tsx           # Protected layout
│   │   ├── dashboard/page.tsx
│   │   ├── projects/[id]/page.tsx
│   │   ├── editor/[id]/page.tsx
│   │   └── settings/page.tsx
│   └── api/
│       ├── scripts/
│       │   └── generate/route.ts
│       ├── videos/
│       │   ├── upload/route.ts
│       │   └── process/route.ts
│       └── optimizer/
│           └── analyze/route.ts
├── components/
│   ├── ui/                      # Shadcn UI components
│   ├── ScriptGenerator.tsx
│   ├── VideoUploader.tsx
│   ├── JobProgress.tsx
│   └── ExportModal.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser client
│   │   ├── server.ts            # Server client
│   │   ├── auth.ts              # Auth helpers
│   │   └── storage.ts           # Storage helpers
│   ├── aws/
│   │   ├── s3.ts                # S3 pre-signed URLs
│   │   └── sqs.ts               # Enqueue jobs
│   ├── openai.ts                # OpenAI wrapper
│   └── utils.ts
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── config.toml
├── aws/
│   └── lambda/
│       ├── video-processor/
│       │   ├── index.mjs        # Lambda handler
│       │   ├── ffmpeg.mjs       # FFmpeg logic
│       │   └── package.json
│       └── layers/
│           └── ffmpeg-layer.zip # FFmpeg binary
├── public/
└── types/
    └── database.types.ts        # Generated from Supabase
package.json Skeleton
{
  "name": "slopster-ai",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.0",
    "openai": "^4.60.0",
    "@aws-sdk/client-s3": "^3.650.0",
    "@aws-sdk/client-sqs": "^3.650.0",
    "@aws-sdk/s3-request-presigner": "^3.650.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.5.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0"
  }
}
Supabase Setup Files
lib/supabase/client.ts (Browser)

import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
lib/supabase/server.ts (Server)

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = () => {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
lib/supabase/auth.ts

import { createClient } from './server'

export async function getUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function signInWithGoogle() {
  const supabase = createClient()
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` }
  })
}
lib/supabase/storage.ts

import { createClient } from './client'

export async function uploadFile(bucket: string, path: string, file: File) {
  const supabase = createClient()
  return supabase.storage.from(bucket).upload(path, file)
}

export function getPublicUrl(bucket: string, path: string) {
  const supabase = createClient()
  return supabase.storage.from(bucket).getPublicUrl(path)
}
AWS Lambda Setup
aws/lambda/video-processor/index.mjs

import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { createClient } from '@supabase/supabase-js'
import { processVideo } from './ffmpeg.mjs'

const s3 = new S3Client({ region: process.env.AWS_REGION })
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

export const handler = async (event) => {
  for (const record of event.Records) {
    const message = JSON.parse(record.body)
    const { jobId, inputKey, outputKey, operations } = message

    try {
      // Update job status: processing
      await supabase.from('jobs').update({ status: 'processing' }).eq('id', jobId)

      // Download from S3
      const inputStream = await s3.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: inputKey }))

      // Process with FFmpeg
      const outputBuffer = await processVideo(inputStream.Body, operations)

      // Upload to S3
      await s3.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: outputKey,
        Body: outputBuffer
      }))

      // Update job: completed
      await supabase.from('jobs').update({
        status: 'completed',
        output_url: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${outputKey}`
      }).eq('id', jobId)

    } catch (error) {
      await supabase.from('jobs').update({ status: 'failed', error: error.message }).eq('id', jobId)
    }
  }
}
OpenAI API Wrapper
lib/openai.ts

import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateScript(prompt: string, platform: string, duration: number) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are a viral video script writer for ${platform}. Create engaging ${duration}-second scripts with hooks, CTAs, and timing.`
      },
      { role: 'user', content: prompt }
    ],
    max_tokens: 1500,
    temperature: 0.8
  })

  return {
    script: completion.choices[0].message.content,
    usage: completion.usage,
    cost: calculateCost(completion.usage)
  }
}

function calculateCost(usage: any) {
  const inputCost = (usage.prompt_tokens / 1_000_000) * 2.50
  const outputCost = (usage.completion_tokens / 1_000_000) * 10.00
  return inputCost + outputCost
}
---

Figma UI Plan
File Structure
Slopster.ai (Figma File)
├── 📄 Cover (thumbnail)
├── 🎨 Design System
│   ├── Colors (brand palette)
│   ├── Typography (Inter/Geist)
│   ├── Components (buttons, inputs, cards)
│   └── Icons (Lucide React)
├── 🖼️ Wireframes
│   ├── 01 - Landing Page
│   ├── 02 - Auth (Login/Signup)
│   ├── 03 - Dashboard (Empty + Filled)
│   ├── 04 - Script Generator
│   ├── 05 - Video Upload
│   ├── 06 - Editor (Timeline + Preview)
│   ├── 07 - Optimizer Results
│   └── 08 - Export Modal
└── 🚀 High-Fidelity Mockups (after wireframe approval)
Key Screens (Priority Order)
Dashboard (Logged-in home)
Top nav: Logo, Projects, Settings, User avatar
Hero: "Create New Project" CTA
Project grid: Thumbnails, title, status, last edited
Script Generator
Left panel: Form (idea input, platform dropdown, duration slider, tone)
Right panel: Generated script (editable blocks)
Bottom: Token usage, cost, "Save Script" button
Video Upload
Drag-and-drop zone
Upload progress bar
Video preview (thumbnail + metadata)
Editor (Core experience)
Left sidebar: Script (synced with video)
Center: Video preview
Right sidebar: Edit controls (trim, captions, transitions)
Bottom timeline: Waveform + markers
Export Modal
Download MP4 button
Metadata preview (title, description, hashtags)
Copy to clipboard (hashtags)
---

First 10 GitHub Issues
Issue #1: Project Setup & Monorepo Structure
Label: infra

Priority: P0

Description:

Initialize Next.js 14 with App Router
Set up Tailwind CSS + TypeScript
Create folder structure (app/, lib/, components/)
Add .env.local.example with required keys
Set up ESLint + Prettier
Issue #2: Supabase Integration & Auth Setup
Label: backend, auth

Priority: P0

Description:

Install Supabase client (@supabase/supabase-js, @supabase/ssr)
Create lib/supabase/client.ts and lib/supabase/server.ts
Implement email/password auth (sign up, log in, log out)
Add Google OAuth provider
Create auth callback route (app/auth/callback/page.tsx)
Issue #3: Database Schema & Migrations
Label: backend

Priority: P0

Description:

Create Supabase migration: users, projects, scripts, videos, jobs tables
Set up Row-Level Security (RLS) policies
Generate TypeScript types (supabase gen types typescript)
Add foreign keys and indexes
Issue #4: AWS S3 + SQS + Lambda Setup
Label: infra, backend

Priority: P1

Description:

Create S3 bucket (slopster-videos-{env})
Set up SQS queue (video-processing-queue)
Create IAM role for Lambda (S3 + SQS + CloudWatch access)
Deploy Lambda function with FFmpeg layer
Test SQS → Lambda → S3 pipeline
Issue #5: AI Script Generator (OpenAI Integration)
Label: frontend, backend

Priority: P1

Description:

Create lib/openai.ts wrapper
Build script generator UI (components/ScriptGenerator.tsx)
Implement API route (/api/scripts/generate)
Add streaming response (Server-Sent Events)
Save generated scripts to Supabase
Display token usage + cost
Issue #6: Video Upload Component & S3 Pre-signed URLs
Label: frontend, backend

Priority: P1

Description:

Build drag-and-drop uploader (components/VideoUploader.tsx)
Implement S3 pre-signed URL generation (/api/videos/upload)
Upload progress bar (XMLHttpRequest or @aws-sdk/lib-storage)
Extract video metadata (duration, resolution, size)
Save video record to Supabase
Issue #7: Lambda FFmpeg Video Processing
Label: backend

Priority: P1

Description:

Implement FFmpeg logic in Lambda (aws/lambda/video-processor/ffmpeg.mjs)
Operations: Trim, add hardcoded captions, transitions, format conversion
Update job status in Supabase (queued → processing → completed)
Generate output S3 URL
Handle errors (timeout, memory limits)
Issue #8: Real-time Job Progress (Supabase Realtime)
Label: frontend

Priority: P2

Description:

Subscribe to jobs table changes (components/JobProgress.tsx)
Show progress bar + status (queued, processing, completed, failed)
Display ETA and current operation
Add toast notifications on completion/failure
Issue #9: Virality Optimizer (OpenAI Analysis)
Label: frontend, backend

Priority: P2

Description:

Create optimizer API route (/api/optimizer/analyze)
OpenAI GPT-4o-mini prompt: Analyze script/video for virality
Return score (1-10), hashtags, posting times, sound suggestions
Build results UI (components/OptimizerResults.tsx)
Save optimizer reports to Supabase
Issue #10: Export Flow (Download + Metadata)
Label: frontend

Priority: P2

Description:

Generate S3 pre-signed download URLs
Build export modal (components/ExportModal.tsx)
Download MP4 button
Export metadata as JSON (title, description, hashtags, posting times)
Copy to clipboard functionality
Track export history
---

Next Steps
Bootstrap the repo: Run npx create-next-app@latest slopster-ai with TypeScript + Tailwind
Set up Supabase project: Create project at supabase.com, copy keys to .env.local
Create AWS resources: S3 bucket, SQS queue, Lambda function (can use AWS CLI or Console)
Start with Issue #1: Set up monorepo structure and dependencies
Build in phases: Complete Phase 1 (Weeks 1-3) before moving to Phase 2
Budget check: You're targeting <$10/month for MVP, well within the $200 limit. You'll have room for growth and unexpected costs.

Deployment: Vercel auto-deploys from GitHub (main branch). Lambda deployed via AWS Console or serverless framework.

