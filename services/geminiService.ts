import { GoogleGenAI } from "@google/genai";

// Access the API key injected by Vite
// The 'define' plugin in vite.config.ts replaces process.env.API_KEY with the actual string
const API_KEY = process.env.API_KEY || '';

let aiClient: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!aiClient) {
    if (!API_KEY) {
      console.warn("API Key is missing. AI features will likely fail.");
    }
    aiClient = new GoogleGenAI({ apiKey: API_KEY });
  }
  return aiClient;
};

export const generateCaption = async (imageBase64: string, language: string = 'zh-CN'): Promise<string> => {
  try {
    // Lazy initialize client here
    const ai = getAiClient();

    // Detect mime type from the data URL (e.g., data:image/jpeg;base64,...)
    const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    // Remove data URL prefix to get raw base64
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");

    const prompt = `
      Analyze this image. Return a SINGLE, cute, and relevant Kaomoji (颜文字) that matches the mood of the photo.
      Example outputs: (｡♥‿♥｡), (⊙_⊙), (≧◡≦), (TwT), (o_O), (*^▽^*).
      ONLY return the Kaomoji string. No text.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64
            }
          },
          {
            text: prompt
          }
        ]
      }
    });

    return response.text ? response.text.trim() : "(*^▽^*)";
  } catch (error) {
    console.error("Error generating caption:", error);
    return "(*^▽^*)";
  }
};