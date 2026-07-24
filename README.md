# site-template

Frontend-only static site template for AWS Lambda (serverless).

> **AI agents:** read [AGENTS.md](./AGENTS.md) before making any changes.

---

## Stack

> **FIXED — do not change.**

- React
- TypeScript
- Vite
- Tailwind CSS
- SST `StaticSite`
- AWS S3 + CloudFront (served via AWS Lambda / serverless infrastructure)

## Architecture

```txt
User
  ↓
CloudFront
  ↓
S3 static assets  ← this is the current phase (frontend only, stateless)
```

Future phases will extend this without changing the frontend structure:

```txt
User
  ↓
CloudFront
  ↓
Static React site
  ↓
API Gateway / Lambda  # future phase
  ↓
RDS / RDS Proxy       # future phase — DB will be provided externally
```

## Stateless requirement

Because the site runs on AWS Lambda (serverless), **the whole repository must be stateless**:

- No server-side sessions or in-memory caches.
- No writes to the local filesystem at runtime.
- No database connections in this phase.
- All dynamic data must be fetched from future external APIs or stored in the browser (localStorage, sessionStorage, cookies).

## Commands

> **FIXED — do not modify these scripts in `package.json`.**

Install dependencies:

```bash
npm install
```

Local development server:

```bash
npm run dev
```

Type-check and build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

Lint the codebase:

```bash
npm run lint
```

Deploy to AWS (development stage):

```bash
npm run deploy -- --stage dev
```

Deploy to AWS (production):

```bash
npm run deploy -- --stage production
```

Remove a non-production stage:

```bash
npm run remove -- --stage dev
```

Production resources are protected in `sst.config.ts`.

## Environment variables

Frontend variables must start with `VITE_`.

Copy the example file:

```bash
cp .env.example .env.local
```

Current variables:

```txt
VITE_APP_NAME=site-template
VITE_API_BASE_URL=
```

`VITE_API_BASE_URL` is intentionally empty for phase 1. When a backend is added later, point it at the API URL.

## Lambda-ready archive

The repository root includes [lambda.mjs](/Users/anciank/projects/site-template/lambda.mjs:1), a Node.js Lambda handler that serves the committed Vite build from `dist/`.

That means the `repo.zip` produced by the `s3+zip://` remote can be used as a Lambda zip artifact as long as:

- the runtime is `nodejs20.x` or newer
- the handler is `index.handler` or `lambda.handler`
- `dist/` is present in the archive

The handler serves built assets directly and falls back to `dist/index.html` for SPA routes.

## Project structure

```txt
src/
  components/     reusable UI components
  data/           editable site content
  lib/            config, API helpers, utilities
  pages/          page-level React views
```
