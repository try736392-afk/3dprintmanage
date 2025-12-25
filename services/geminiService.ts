import { GoogleGenAI } from "@google/genai";
import { MaterialType } from "../types";

// Initialize the client conditionally to prevent crashing if API_KEY is missing.
let ai: GoogleGenAI | null = null;
const apiKey = process.env.API_KEY;

if (apiKey) {
  try {
    ai = new GoogleGenAI({ apiKey: apiKey });
  } catch (e) {
    console.error("Failed to initialize Gemini API client:", e);
  }
} else {
  console.warn("API_KEY is missing. AI features will be disabled.");
}

export const getMaterialAdvice = async (material: MaterialType, query: string): Promise<string> => {
  if (!ai) {
    return "系统未配置 API Key，AI 顾问功能暂时无法使用。";
  }

  try {
    const model = 'gemini-3-flash-preview';
    const systemInstruction = `你是一位专业的 3D 打印顾问。
    用户会询问关于特定耗材（如 PLA, PETG 等）的问题。
    请提供关于温度、热床附着、冷却或故障排除的简明实用建议。
    回答请保持简短（100 字以内），必要时使用要点列表。
    请务必使用中文回答。`;

    const response = await ai.models.generateContent({
      model: model,
      contents: `材质: ${material}. 用户问题: ${query}`,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    return response.text || "暂时无法提供建议。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "抱歉，无法连接到 AI 顾问。请检查您的网络配置。";
  }
};