import { zodTextFormat } from 'openai/helpers/zod';
import { generatedPostSchema } from '../ai.schemas.js';
import { openai } from '../ai.client.js';
import { buildGenerationPrompt } from '../ai.prompts.js';

export async function generateStrategy(input: {
  businessSummary: string;
  audience: string;
  tone: string;
  goals: string[];
  recentPosts: string[];
  userPrompt: string;
  postType: string;
  platforms: string[];
}) {
  const response = await openai.responses.parse({
    model: 'gpt-4.1-mini',
    input: buildGenerationPrompt(input),
    text: {
      format: zodTextFormat(generatedPostSchema, 'generated_post')
    }
  });

  return response.output_parsed;
}
