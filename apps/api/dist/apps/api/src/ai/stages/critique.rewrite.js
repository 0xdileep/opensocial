import { openai } from '../ai.client.js';
import { buildCriticPrompt } from '../ai.prompts.js';
export async function critiqueAndRewrite(text) {
    const response = await openai.responses.create({
        model: 'gpt-4.1-mini',
        input: buildCriticPrompt(text)
    });
    return response.output_text.trim();
}
