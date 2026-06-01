export type Platform = 'meta_instagram' | 'meta_facebook' | 'linkedin' | 'x' | 'tiktok' | 'youtube';

export type PostType =
  | 'sales'
  | 'casual'
  | 'educational'
  | 'storytelling'
  | 'comparison'
  | 'case_study'
  | 'testimonial'
  | 'offer';

export type PostStatus =
  | 'draft'
  | 'generating'
  | 'generated'
  | 'pending_approval'
  | 'scheduled'
  | 'publishing'
  | 'published'
  | 'failed';

export interface BrandProfile {
  id: string;
  workspaceId: string;
  name: string;
  businessSummary: string;
  audience: string;
  tone: string;
  goals: string[];
  bannedPhrases: string[];
  requiredMentions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PlatformTarget {
  platform: Platform;
  enabled: boolean;
}

export interface PostDraft {
  id: string;
  workspaceId: string;
  brandId: string;
  sourceType: 'manual' | 'auto';
  postType: PostType;
  textMaster: string;
  imagePrompt: string;
  imageUrl?: string;
  qualityScore: number;
  status: PostStatus;
  scheduledFor?: string;
  platformTargets: PlatformTarget[];
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleRule {
  id: string;
  workspaceId: string;
  brandId: string;
  enabled: boolean;
  timezone: string;
  daysOfWeek: number[];
  localTime: string;
  postTypes: PostType[];
  platforms: Platform[];
  requireApproval: boolean;
}

export interface GeneratePostInput {
  workspaceId: string;
  brandId: string;
  prompt: string;
  postType: PostType;
  platforms: Platform[];
  withImage: boolean;
  requireApproval: boolean;
  scheduledFor?: string;
}

export interface GeneratedPostPayload {
  postType: PostType;
  subtype: string;
  objective: string;
  text: string;
  imagePrompt: string;
  hashtags: string[];
  cta: string;
  qualityScore: number;
  needsRewrite: boolean;
  uniquenessReason: string;
}
