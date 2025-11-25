import { GoogleGenAI } from "@google/genai";

// Expanded fallback list (50 items)
const FALLBACK_KAOMOJIS = [
  "(*^▽^*)", "(｡♥‿♥｡)", "(⊙_⊙)", "(≧◡≦)", "(TwT)", 
  "(o_O)", "(¬_¬)", "(^_-)", "(>_<)", "(=^･ω･^=)",
  "(UwU)", "(T_T)", "(O_O;)", "(^_^)/", "(>.<)",
  "(o.o)", "(¬‿¬)", "(X_X)", "(OoO)", "(^o^)",
  "(◕‿◕)", "(ಠ_ಠ)", "(♥_♥)", "(~_~;)", "(^_−)☆",
  "(>ᴗ<)", "(･ω･)b", "(•‿•)", "(;´༎ຶД༎ຶ`)", "(¬_¬\")",
  "(￣▽￣)", "(⊙x⊙;)", "(⁄ ⁄•⁄ω⁄•⁄ ⁄)", "(^.^)y-~", "(╬ Ò ‸ Ó)",
  "(つ≧▽≦)つ", "( •̀ ω •́ )y", "(´･ω･`)", "(ノ_<。)", "(￣y▽,￣)╭ ",
  "(*￣3￣)╭", "(o゜▽゜)o☆", "(´。＿。｀)", "(。・∀・)ノ", "(✿◡‿◡)",
  "(★ ω ★)", "(￣_,￣ )", "(oﾟvﾟ)ノ", "(´▽`ʃ♡ƪ)", "(❤ ω ❤)"
];

// Access the API key injected by Vite
const API_KEY = process.env.API_KEY || '';

let aiClient: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!aiClient) {
    if (!API_KEY) {
      console.warn("API Key is missing. AI features will failover to random kaomojis.");
    }
    aiClient = new GoogleGenAI({ apiKey: API_KEY });
  }
  return aiClient;
};

export const generateCaption = async (imageBase64: string, language: string = 'zh-CN'): Promise<string> => {
  try {
    if (!imageBase64) return getRandomFallback();

    const ai = getAiClient();

    // Clean base64 string
    let cleanBase64 = imageBase64;
    let mimeType = 'image/jpeg';

    if (imageBase64.includes(',')) {
        const parts = imageBase64.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        if (mimeMatch) mimeType = mimeMatch[1];
        cleanBase64 = parts[1];
    }

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

    return response.text ? response.text.trim() : getRandomFallback();

  } catch (error) {
    console.error("Error generating caption:", error);
    return getRandomFallback();
  }
};

const getRandomFallback = () => {
    return FALLBACK_KAOMOJIS[Math.floor(Math.random() * FALLBACK_KAOMOJIS.length)];
};