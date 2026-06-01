# OpenSocial

Open-source social media content generation, approval, scheduling, and publishing platform built with Fastify, React, TypeScript, and PostgreSQL. It includes a monorepo API, a web control panel, shared schemas/types, and platform-specific publishing adapters for Meta, LinkedIn, X, TikTok, and YouTube. [code_file:1]

## Features

- Brand profiles with tone, audience, goals, banned phrases, and required mentions [code_file:1]
- AI-assisted post generation pipeline with optional image workflow [code_file:1]
- Approval flow for human review before publishing [code_file:1]
- Scheduling by weekday, time, timezone, platform, and post type [code_file:1]
- Publish-now flow with publish attempt history [code_file:1]
- Platform account management with masked token display [code_file:1]
- Shared TypeScript schemas between frontend and backend [code_file:1]
- Platform-specific publishing adapters for:
  - Meta Instagram [code_file:1]
  - Meta Facebook [code_file:1]
  - LinkedIn [code_file:1]
  - X [code_file:1]
  - TikTok [code_file:1]
  - YouTube [code_file:1]

## Tech Stack

### Backend
- Fastify [code_file:1]
- TypeScript [code_file:1]
- PostgreSQL [code_file:1]
- Zod [code_file:1]

### Frontend
- React [code_file:1]
- Vite [code_file:1]
- TypeScript [code_file:1]

### Shared
- Shared package for schemas and types across API and web [code_file:1]

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

- Meta Facebook text and image posting [code_file:1]
- Meta Instagram image-first posting [code_file:1]
- LinkedIn text and image posting [code_file:1]
- X text and image posting [code_file:1]
- TikTok video and photo posting [code_file:1]
- YouTube resumable video upload [code_file:1]

## Requirements

- Node.js 20+
- npm 10+
- PostgreSQL 14+
- OpenAI API key
- Platform API credentials for any networks you want to publish to [code_file:1]

## Environment Variables

Create `apps/api/.env`:

```env
PORT=4000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/social_ai
OPENAI_API_KEY=your_openai_api_key
APP_BASE_URL=http://localhost:4000
TOKEN_ENCRYPTION_KEY=replace_with_a_secret_at_least_32_characters_long
```

These variable names match the API config in `apps/api/src/config/env.ts`. [code_file:1]

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

The API package defines `migrate` as `tsx src/db/migrate.ts`. [code_file:1]

## Development

Run both API and web apps together from the repo root:

```bash
npm run dev
```

This uses the root workspace script to start:
- `@social-ai/api` with `tsx watch src/server.ts`
- `@social-ai/web` with `vite` [code_file:1]

## Build

```bash
npm run build
```

The root workspace build script runs builds for all workspaces. [code_file:1]

## Typecheck

```bash
npm run typecheck
```

The root workspace typecheck script runs typechecks for all workspaces. [code_file:1]

## Usage

### 1. Create a brand
Add:
- business summary
- target audience
- tone
- goals
- banned phrases
- required mentions [code_file:1]

### 2. Connect platform accounts
Add:
- access token
- optional refresh token
- platform-specific metadata [code_file:1]

Examples of platform metadata:
- Facebook: `{"pageId":"..."}`
- Instagram: `{"instagramBusinessId":"..."}`
- LinkedIn: `{"authorUrn":"urn:li:person:..."}`
- TikTok: `{"openId":"...","videoUrl":"https://.../video.mp4","photoImages":["https://verified.example.com/photo1.jpg"],"privacyLevel":"SELF_ONLY","postMode":"DIRECT_POST"}`
- YouTube: `{"videoUrl":"https://.../video.mp4","title":"Optional title","privacyStatus":"private"}`
- X: `{}` [code_file:1]

### 3. Generate a post
Choose:
- prompt
- post type
- target platforms
- image on/off
- approval required or not
- optional schedule time [code_file:1]

### 4. Review approvals
Posts requiring review move into the approvals queue. [code_file:1]

### 5. Publish now or schedule
Publish immediately or let the scheduler publish due posts. [code_file:1]

### 6. Inspect publish attempts
Each post can show attempt history and platform-specific failure details. [code_file:1]

## Security

- Platform access tokens are encrypted before storage in the backend [code_file:1]
- Tokens are masked in API/UI responses [code_file:1]
- Platform account metadata is validated as structured JSON [code_file:1]
- Workspace-scoped request checks are enforced in API routes through the `x-workspace-id` header [code_file:1]

## Platform Notes

### Meta
- Instagram is image-first in this project [code_file:1]
- Facebook supports text and image posting [code_file:1]

### LinkedIn
- Supports text and image posts [code_file:1]
- Image posting uses upload registration, media upload, and post creation [code_file:1]

### X
- Supports text and image posting [code_file:1]
- Image posting uses X media upload before tweet creation [code_file:1]

### TikTok
- Supports video publishing [code_file:1]
- Supports photo posting when image inputs are provided [code_file:1]
- Requires metadata such as `openId` and optional media fields [code_file:1]

### YouTube
- Uses resumable upload [code_file:1]
- Supports metadata such as title and privacy status [code_file:1]

## Current Status

This project is a strong self-hosted foundation for social publishing workflows. It is intended as a developer-friendly base that you can extend with authentication, background workers, analytics, CI/CD, and additional platform handling as needed. [code_file:1]

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