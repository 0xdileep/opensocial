export function finalizeImagePrompt(rawPrompt: string, brandName: string) {
  return `${rawPrompt}. Brand context: ${brandName}. Social media campaign image, high quality, clean composition, no text overlay unless necessary.`;
}
