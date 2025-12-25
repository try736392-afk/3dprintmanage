import { GoogleGenAI } from "@google/genai";
import { MaterialType } from "../types";

// Initialize the client. ensure process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMaterialAdvice = async (material: MaterialType, query: string): Promise<string> => {
  try {
    const model = 'gemini-3-flash-preview';
    const systemInstruction = `You are an expert 3D printing advisor. 
    The user asks questions about specific filament materials (e.g., PLA, PETG).
    Provide concise, practical advice regarding temperatures, bed adhesion, cooling, or troubleshooting.
    Keep answers short (under 100 words) and formatted with bullet points if necessary.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: `Material: ${material}. User Question: ${query}`,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    return response.text || "No advice available at the moment.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I couldn't connect to the AI advisor. Please check your network or API key.";
  }
};