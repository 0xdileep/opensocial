# OpenSocial

Open-source social media content generation, approval, scheduling, and publishing platform built with Fastify, React, TypeScript, and PostgreSQL. It includes a monorepo API, a web control panel, shared schemas/types, and platform-specific publishing adapters for Meta, LinkedIn, X, TikTok, and YouTube.  

## Features

- Brand profiles with tone, audience, goals, banned phrases, and required mentions  
- AI-assisted post generation pipeline with optional image workflow  
- Approval flow for human review before publishing  
- Scheduling by weekday, time, timezone, platform, and post type  
- Publish-now flow with publish attempt history  
- Platform account management with masked token display  
- Shared TypeScript schemas between frontend and backend  
- Platform-specific publishing adapters for:
  - Meta Instagram  
  - Meta Facebook  
  - LinkedIn  
  - X  
  - TikTok  
  - YouTube  

## Tech Stack

### Backend
- Fastify  
- TypeScript  
- PostgreSQL  
- Zod  

### Frontend
- React  
- Vite  
- TypeScript  

### Shared
- Shared package for schemas and types across API and web  

## Project Structure

```text
social-ai-product/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── ai/
│   │   │   ├── config/
│   │   │   ├── db/
│   │   │   ├── jobs/
│   │   │   ├── lib/
│   │   │   ├── modules/
│   │   │   ├── providers/
│   │   │   ├── app.ts
│   │   │   └── server.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/
│       ├── src/
│       │   ├── app/
│       │   ├── components/
│       │   ├── lib/
│       │   ├── main.tsx
│       │   └── styles.css
│       ├── index.html
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── index.ts
│       │   ├── schemas.ts
│       │   └── types.ts
│       └── package.json
├── package.json
├── package-lock.json
└── tsconfig.base.json
```

## Supported Publishing Flows

- Meta Facebook text and image posting  
- Meta Instagram image-first posting  
- LinkedIn text and image posting  
- X text and image posting  
- TikTok video and photo posting  
- YouTube resumable video upload  

## Requirements

- Node.js 20+
- npm 10+
- PostgreSQL 14+
- OpenAI API key
- Platform API credentials for any networks you want to publish to  

## Environment Variables

Create `apps/api/.env`:

```env
PORT=4000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/social_ai
OPENAI_API_KEY=your_openai_api_key
APP_BASE_URL=http://localhost:4000
TOKEN_ENCRYPTION_KEY=replace_with_a_secret_at_least_32_characters_long
```

These variable names match the API config in `apps/api/src/config/env.ts`.  

## Installation

```bash
git clone https://github.com/your-username/social-ai.git
cd social-ai
npm install
```

## Database Setup

Run the API migration command:

```bash
npm run migrate -w @social-ai/api
```

The API package defines `migrate` as `tsx src/db/migrate.ts`.  

## Development

Run both API and web apps together from the repo root:

```bash
npm run dev
```

This uses the root workspace script to start:
- `@social-ai/api` with `tsx watch src/server.ts`
- `@social-ai/web` with `vite`  

## Build

```bash
npm run build
```

The root workspace build script runs builds for all workspaces.  

## Typecheck

```bash
npm run typecheck
```

The root workspace typecheck script runs typechecks for all workspaces.  

## Usage

### 1. Create a brand
Add:
- business summary
- target audience
- tone
- goals
- banned phrases
- required mentions  

### 2. Connect platform accounts
Add:
- access token
- optional refresh token
- platform-specific metadata  

Examples of platform metadata:
- Facebook: `{"pageId":"..."}`
- Instagram: `{"instagramBusinessId":"..."}`
- LinkedIn: `{"authorUrn":"urn:li:person:..."}`
- TikTok: `{"openId":"...","videoUrl":"https://.../video.mp4","photoImages":["https://verified.example.com/photo1.jpg"],"privacyLevel":"SELF_ONLY","postMode":"DIRECT_POST"}`
- YouTube: `{"videoUrl":"https://.../video.mp4","title":"Optional title","privacyStatus":"private"}`
- X: `{}`  

### 3. Generate a post
Choose:
- prompt
- post type
- target platforms
- image on/off
- approval required or not
- optional schedule time  

### 4. Review approvals
Posts requiring review move into the approvals queue.  

### 5. Publish now or schedule
Publish immediately or let the scheduler publish due posts.  

### 6. Inspect publish attempts
Each post can show attempt history and platform-specific failure details.  

## Security

- Platform access tokens are encrypted before storage in the backend  
- Tokens are masked in API/UI responses  
- Platform account metadata is validated as structured JSON  
- Workspace-scoped request checks are enforced in API routes through the `x-workspace-id` header  

## Platform Notes

### Meta
- Instagram is image-first in this project  
- Facebook supports text and image posting  

### LinkedIn
- Supports text and image posts  
- Image posting uses upload registration, media upload, and post creation  

### X
- Supports text and image posting  
- Image posting uses X media upload before tweet creation  

### TikTok
- Supports video publishing  
- Supports photo posting when image inputs are provided  
- Requires metadata such as `openId` and optional media fields  

### YouTube
- Uses resumable upload  
- Supports metadata such as title and privacy status  

## Current Status

This project is a strong self-hosted foundation for social publishing workflows. It is intended as a developer-friendly base that you can extend with authentication, background workers, analytics, CI/CD, and additional platform handling as needed.  

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make focused changes
4. Run:
   ```bash
   npm run typecheck
   npm run build
   ```
5. Open a pull request

## License

MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.