import { openai } from '../ai.client.js';
import { AppError } from '../../lib/errors.js';

export async function generateImage(prompt: string) {
  const result = await openai.images.generate({
    model: 'gpt-image-1',
    prompt,
    size: '1536x1024'
  });

  const imageBase64 = result.data?.[0]?.b64_json;
  if (!imageBase64) throw new AppError('Image generation failed', 502);
  return `data:image/png;base64,${imageBase64}`;
}
