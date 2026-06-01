import { z } from 'zod';
export const platformSchema = z.enum([
    'meta_instagram',
    'meta_facebook',
    'linkedin',
    'x',
    'tiktok',
    'youtube'
]);
export const postTypeSchema = z.enum([
    'sales',
    'casual',
    'educational',
    'storytelling',
    'comparison',
    'case_study',
    'testimonial',
    'offer'
]);
export const generatePostInputSchema = z.object({
    workspaceId: z.string().min(1),
    brandId: z.string().min(1),
    prompt: z.string().min(1),
    postType: postTypeSchema,
    platforms: z.array(platformSchema).min(1),
    withImage: z.boolean().default(true),
    requireApproval: z.boolean().default(true),
    scheduledFor: z.string().datetime().optional()
});
