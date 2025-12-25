import { GoogleGenAI } from "@google/genai";
import { MaterialType } from "../types";
import { loadApiKey } from "./storageService";

const getClient = (): GoogleGenAI | null => {
  // 1. Try to get key from LocalStorage (User Settings)
  let key = loadApiKey();

  // 2. Fallback to Environment Variable (System Config)
  // Check if process is defined to avoid crashing in some browser environments
  if (!key && typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    key = process.env.API_KEY;
  }

  if (!key) return null;

  try {
    return new GoogleGenAI({ apiKey: key });
  } catch (e) {
    console.error("Failed to initialize Gemini Client", e);
    return null;
  }
};

export const getMaterialAdvice = async (material: MaterialType, query: string): Promise<string> => {
  const ai = getClient();

  if (!ai) {
    return "请点击右上角设置图标，配置您的 Gemini API Key 以使用 AI 顾问功能。";
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
    return "AI 服务连接失败。请检查您的 API Key 是否有效，或网络是否通畅。";
  }
};