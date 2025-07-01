# INSTRUCTIONS2.md - Implementation Guidelines

[Previous content remains the same...]

## Security Implementation

### 1. Content Security Policy

Create new file `public/_headers`:
```plaintext
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.openai.com https://*.sentry.io;
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 2. Mini App Sandbox Implementation

Create new file `utils/sandbox.ts`:
```typescript
interface SandboxOptions {
  allowNetwork?: boolean;
  allowStorage?: boolean;
  timeout?: number;
}

export class MiniAppSandbox {
  private iframe: HTMLIFrameElement | null = null;
  private allowedAPIs: string[] = [];

  constructor(private options: SandboxOptions = {}) {
    this.allowedAPIs = this.getallowedAPIs();
  }

  private getallowedAPIs(): string[] {
    const apis = ['console', 'setTimeout', 'clearTimeout'];
    if (this.options.allowNetwork) apis.push('fetch');
    if (this.options.allowStorage) apis.push('localStorage', 'sessionStorage');
    return apis;
  }

  async runCode(code: string): Promise<void> {
    // Create sandbox iframe
    this.iframe = document.createElement('iframe');
    this.iframe.sandbox.add('allow-scripts');
    this.iframe.style.display = 'none';
    document.body.appendChild(this.iframe);

    try {
      // Create secure context
      const secureContext = `
        const secureWindow = {
          ${this.allowedAPIs.map(api => `${api}: window.${api}`).join(',\n')}
        };
        const module = { exports: {} };
        const require = undefined;
        const process = undefined;
        with (secureWindow) {
          ${code}
        }
      `;

      // Execute in sandbox with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Execution timeout')), 
          this.options.timeout || 5000);
      });

      await Promise.race([
        new Promise(resolve => {
          if (this.iframe?.contentWindow) {
            this.iframe.contentWindow.eval(secureContext);
            resolve(undefined);
          }
        }),
        timeoutPromise
      ]);
    } finally {
      // Cleanup
      this.iframe?.remove();
      this.iframe = null;
    }
  }
}
```

### 3. Input Validation and Sanitization

Create new file `utils/security.ts`:
```typescript
import DOMPurify from 'dompurify';
import { z } from 'zod';

// Schema validation for mini app input
export const MiniAppSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  creationPrompt: z.string().min(1).max(2000),
  htmlContent: z.string()
});

// HTML sanitization config
const sanitizeConfig = {
  ALLOWED_TAGS: [
    'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'button', 'input', 'a', 'img'
  ],
  ALLOWED_ATTR: [
    'class', 'id', 'style', 'href', 'src', 'alt',
    'data-testid', 'type', 'value', 'disabled'
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
};

export function sanitizeMiniAppContent(html: string): string {
  return DOMPurify.sanitize(html, sanitizeConfig);
}

// Rate limiting for API calls
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = 10,
    private timeWindow: number = 60000
  ) {}

  canMakeRequest(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    
    // Remove expired timestamps
    const validRequests = userRequests.filter(
      timestamp => now - timestamp < this.timeWindow
    );
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(userId, validRequests);
    return true;
  }
}
```

### 4. Secure Storage Implementation

Create new file `utils/secureStorage.ts`:
```typescript
import { AES, enc } from 'crypto-js';

export class SecureStorage {
  private readonly storageKey: string;
  
  constructor(private namespace: string) {
    this.storageKey = `secure_${namespace}`;
  }

  private encrypt(data: any, key: string): string {
    return AES.encrypt(JSON.stringify(data), key).toString();
  }

  private decrypt(encrypted: string, key: string): any {
    const decrypted = AES.decrypt(encrypted, key);
    return JSON.parse(decrypted.toString(enc.Utf8));
  }

  async save(data: any): Promise<void> {
    try {
      const key = await this.getEncryptionKey();
      const encrypted = this.encrypt(data, key);
      localStorage.setItem(this.storageKey, encrypted);
    } catch (error) {
      console.error('Failed to save data securely:', error);
      throw new Error('Storage operation failed');
    }
  }

  async load(): Promise<any | null> {
    try {
      const encrypted = localStorage.getItem(this.storageKey);
      if (!encrypted) return null;
      
      const key = await this.getEncryptionKey();
      return this.decrypt(encrypted, key);
    } catch (error) {
      console.error('Failed to load data:', error);
      return null;
    }
  }

  private async getEncryptionKey(): Promise<string> {
    // In a real implementation, this would use the Web Crypto API
    // and proper key management
    return 'your-secure-key';
  }
}
```

### 5. Security Middleware

Create new file `utils/securityMiddleware.ts`:
```typescript
import { RateLimiter } from './security';

const rateLimiter = new RateLimiter();

export async function validateAndSanitize<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): Promise<T> {
  return schema.parseAsync(data);
}

export function withSecurity(handler: Function) {
  return async (req: Request, userId: string) => {
    // Rate limiting
    if (!rateLimiter.canMakeRequest(userId)) {
      throw new Error('Rate limit exceeded');
    }

    // Validate request
    const validatedData = await validateAndSanitize(
      req.body,
      MiniAppSchema
    );

    // Execute handler with validated data
    const result = await handler(validatedData);

    // Sanitize response
    return {
      ...result,
      htmlContent: sanitizeMiniAppContent(result.htmlContent)
    };
  };
}
```

### 6. Integration with Mini App Components

Update the mini-app handlers to use security features:

```typescript
// In handleCreateMiniApp:
const handleCreateMiniApp = useCallback(async (idea: MiniAppIdea) => {
  try {
    // Validate input
    const validatedIdea = await validateAndSanitize(idea, MiniAppSchema);
    
    // Create sandbox for code execution
    const sandbox = new MiniAppSandbox({
      allowNetwork: false,
      allowStorage: true,
      timeout: 5000
    });

    // Generate and execute code in sandbox
    const code = await generateMiniAppCode(validatedIdea.creationPrompt);
    await sandbox.runCode(code);

    // Store securely
    const storage = new SecureStorage('miniapps');
    await storage.save({
      id: validatedIdea.id,
      code: sanitizeMiniAppContent(code)
    });

  } catch (error) {
    console.error('Security check failed:', error);
    throw new Error('Failed to create mini-app securely');
  }
}, []);
```

### 7. Dependencies to Add

Update `package.json`:
```json
{
  "dependencies": {
    "dompurify": "^3.0.5",
    "crypto-js": "^4.1.1",
    "zod": "^3.21.4"
  },
  "devDependencies": {
    "@types/dompurify": "^3.0.2",
    "@types/crypto-js": "^4.1.1"
  }
}
```

[Previous implementation details remain the same...]
