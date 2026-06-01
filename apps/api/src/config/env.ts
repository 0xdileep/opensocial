import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  APP_BASE_URL: z.string().url().optional(),
  TOKEN_ENCRYPTION_KEY: z.string().min(32)
});

const parsed = envSchema.parse(process.env);

export const env = {
  ...parsed,
  APP_BASE_URL: parsed.APP_BASE_URL ?? `http://localhost:${parsed.PORT}`
};
