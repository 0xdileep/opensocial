import { z } from 'zod';
export const generatedPostSchema = z.object({
    postType: z.string(),
    subtype: z.string(),
    objective: z.string(),
    text: z.string(),
    imagePrompt: z.string(),
    hashtags: z.array(z.string()),
    cta: z.string(),
    qualityScore: z.number().min(0).max(100),
    needsRewrite: z.boolean(),
    uniquenessReason: z.string()
});
export const imageReviewSchema = z.object({
    approved: z.boolean(),
    score: z.number().min(0).max(100),
    issues: z.array(z.string()),
    fixPrompt: z.string().optional()
});
