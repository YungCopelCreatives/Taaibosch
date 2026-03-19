import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateGallerySamples() {
  const prompts = [
    "Professional product photography of a premium bottle of Sea Moss Capsules, minimalist aesthetic, soft natural lighting, white background, high resolution.",
    "Macro shot of golden sea moss capsules spilled out of a wooden bowl, shallow depth of field, organic and natural vibe.",
    "Raw wildcrafted golden sea moss in a glass bowl with water and lime, fresh and vibrant, high-end wellness aesthetic.",
    "Lifestyle shot of a person holding a glass of water and a sea moss capsule, bright morning light, clean and healthy atmosphere."
  ];

  const results = [];
  for (const prompt of prompts) {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
    });
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        results.push(`data:image/png;base64,${part.inlineData.data}`);
      }
    }
  }
  return results;
}
