export function buildGenerationPrompt(input) {
    return [
        'You generate social media posts for businesses.',
        `Business: ${input.businessSummary}`,
        `Audience: ${input.audience}`,
        `Tone: ${input.tone}`,
        `Goals: ${input.goals.join(', ')}`,
        `Recent posts to avoid repeating: ${input.recentPosts.join(' || ') || 'none'}`,
        `Required post type: ${input.postType}`,
        `Platforms: ${input.platforms.join(', ')}`,
        `User request: ${input.userPrompt}`,
        'Return one strong post with clear image direction.'
    ].join('\n');
}
export function buildCriticPrompt(text) {
    return [
        'Review this post for clarity, originality, platform fit, and conversion quality.',
        'If weak, rewrite it stronger but keep it concise.',
        text
    ].join('\n');
}
export function buildImageReviewPrompt(text) {
    return [
        'Review the image against the intended social media post.',
        'Check brand fit, visual quality, readability, realism, and marketing usefulness.',
        `Post text: ${text}`
    ].join('\n');
}
