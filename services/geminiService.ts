
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Suggestion } from "../types";

// Helper to get Gemini client
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeAndSuggestCaptions = async (base64Image: string): Promise<Suggestion[]> => {
  const ai = getAI();
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image.split(',')[1],
    },
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        imagePart,
        { text: "Analyze this image and suggest 5 funny, relevant meme captions. Each caption should have a 'top' part and a 'bottom' part. Keep them witty, culturally relevant, and short." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            top: { type: Type.STRING },
            bottom: { type: Type.STRING },
          },
          required: ["top", "bottom"],
        },
      },
    },
  });

  try {
    const text = response.text || '[]';
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return [];
  }
};

export const editImageWithAI = async (base64Image: string, prompt: string): Promise<string | null> => {
  const ai = getAI();
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image.split(',')[1],
    },
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        imagePart,
        { text: prompt },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  return null;
};

export const describeImage = async (base64Image: string): Promise<string> => {
  const ai = getAI();
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image.split(',')[1],
    },
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        imagePart,
        { text: "Describe this image in detail and tell me what's funny or interesting about it for a meme context." }
      ]
    },
  });

  return response.text || "No description available.";
};
