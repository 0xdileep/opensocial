import { zodTextFormat } from 'openai/helpers/zod';
import { openai } from '../ai.client.js';
import { imageReviewSchema } from '../ai.schemas.js';
import { buildImageReviewPrompt } from '../ai.prompts.js';
export async function reviewImage(text, imageUrl) {
    const response = await openai.responses.parse({
        model: 'gpt-4.1-mini',
        input: [{
                role: 'user',
                content: [
                    { type: 'input_text', text: buildImageReviewPrompt(text) },
                    { type: 'input_image', image_url: imageUrl, detail: 'auto' }
                ]
            }],
        text: {
            format: zodTextFormat(imageReviewSchema, 'image_review')
        }
    });
    return response.output_parsed;
}
