# Vercel + Groq Integration

After installation, the Groq integration can automatically:

- create a free GroqCloud account for you, or
- link your existing GroqCloud account (if the same email is used in GroqCloud and Vercel).

This allows linking GroqCloud with your Vercel project and syncing `GROQ_API_KEY` into Vercel environment variables.

You can verify the synced key in:

- **Vercel → Project Settings → Environment Variables**

## Usage example

```ts
import { streamText } from 'ai';
import { groq } from '@ai-sdk/groq';

async function main() {
  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    prompt: 'Why do Vercel and Groq work so well together?',
  });

  for await (const textPart of result.textStream) {
    process.stdout.write(textPart);
  }
}

main().catch(console.error);
```
