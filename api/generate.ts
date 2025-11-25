import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: 'edge', // Use Edge runtime for faster cold starts
};

export default async function handler(req) {
  // CORS headers for local testing if needed, Vercel handles this automatically in prod usually
  // but helpful for clarity
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { imageBase64 } = await req.json();
    const API_KEY = process.env.API_KEY;

    if (!API_KEY) {
      return new Response(JSON.stringify({ error: 'Server API Key configuration missing' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'Image data missing' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    // Clean base64 string
    // Some clients send "data:image/jpeg;base64,..." others send raw
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

    const text = response.text ? response.text.trim() : "(*^▽^*)";
    
    return new Response(JSON.stringify({ caption: text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Serverless Function Error:", error);
    return new Response(JSON.stringify({ error: 'Failed to generate content' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}