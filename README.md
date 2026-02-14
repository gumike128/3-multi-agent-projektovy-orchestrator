# Multi-Agent Projektový Orchestrátor

This project is a Vite + React application for orchestrating AI-assisted project planning workflows.

## Run locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables in `.env.local`:
   ```bash
   API_KEY=your_google_gemini_api_key
   ```
3. Start development server:
   ```bash
   npm run dev
   ```

## Vercel deployment

For production deployment on Vercel, add the following variable in **Project Settings → Environment Variables**:

- `API_KEY` (required by this app for Gemini requests)

Then redeploy your project.

## Groq integration notes (Vercel)

If you install the official Groq integration in Vercel, Vercel can automatically create/link your GroqCloud account and sync `GROQ_API_KEY` into your project environment variables.

- You can verify this in Vercel: **Project Settings → Environment Variables**.
- This app currently uses `API_KEY` for Gemini-based services.
- If you are building a Groq-backed path, see `docs/vercel-groq-integration.md` for the usage example and flow.
