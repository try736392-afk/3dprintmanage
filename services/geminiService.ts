import { GoogleGenAI } from "@google/genai";
import { MaterialType } from "../types";

const getClient = (): GoogleGenAI => {
  // API Key must be obtained exclusively from the environment variable process.env.API_KEY
  // Assume this variable is pre-configured, valid, and accessible.
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const getMaterialAdvice = async (material: MaterialType, query: string): Promise<string> => {
  try {
    const ai = getClient();
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
    return "AI 服务暂时不可用。";
  }
};