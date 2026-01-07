
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { StoryboardCut, AspectRatio, Resolution } from "../types";

/**
 * 전달받은 API 키를 사용하여 GoogleGenAI 인스턴스를 생성합니다.
 */
const getAiInstance = (apiKey: string) => {
  return new GoogleGenAI({ apiKey });
};

/**
 * API 키 유효성을 검사하기 위한 테스트 호출
 */
export const testConnection = async (apiKey: string): Promise<boolean> => {
  try {
    const ai = getAiInstance(apiKey);
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'hi',
    });
    return !!response.text;
  } catch (error) {
    console.error("API Key Test Failed:", error);
    return false;
  }
};

export const generateStoryboardLogic = async (
  apiKey: string,
  baseImageUrl: string | null, 
  template: string, 
  customScenario?: string
): Promise<{ scenes: { prompt: string, caption: string }[] }> => {
  const ai = getAiInstance(apiKey);
  const contents: any[] = [];
  
  if (baseImageUrl) {
    const mimeType = baseImageUrl.match(/data:(.*?);/)?.[1] || 'image/jpeg';
    const base64Data = baseImageUrl.split(',')[1];
    contents.push({ inlineData: { data: base64Data, mimeType: mimeType } });
  }

  const promptText = `당신은 세계적인 영화 감독이자 비주얼 스토리텔러입니다. 
  ${customScenario ? `다음 시나리오를 바탕으로: "${customScenario}"` : "업로드된 이미지를 분석하여"} 
  "${template}" 템플릿에 맞춰 9개의 시퀀스를 기획하세요.
  
  지침:
  1. ${baseImageUrl ? "원본 이미지의 캐릭터 특징(외모, 의상)과 톤앤매너를 모든 컷에서 엄격하게 유지하세요." : "일관된 캐릭터와 화풍을 9개의 컷 전체에서 유지하세요."}
  2. 각 장면은 독립된 이미지 생성 프롬프트(영문)와 사용자가 읽을 한국어 지문(caption)으로 구성됩니다.
  3. 한국어 지문은 영화 대본처럼 현장감 있고 상세하게 작성하세요.
  
  Return ONLY valid JSON: { "scenes": [ { "prompt": "detailed english prompt for image generation", "caption": "상세한 한국어 장면 설명" } ] }`;

  contents.push({ text: promptText });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: contents }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                prompt: { type: Type.STRING },
                caption: { type: Type.STRING }
              },
              required: ["prompt", "caption"]
            }
          }
        },
        required: ["scenes"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse storyboard logic", e);
    throw e;
  }
};

export const generateImage = async (
  apiKey: string,
  baseImageUrl: string | null, 
  prompt: string, 
  aspectRatio: AspectRatio,
  resolution?: Resolution
): Promise<string> => {
  const ai = getAiInstance(apiKey);
  const modelName = resolution ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  
  const parts: any[] = [];
  if (baseImageUrl) {
    const mimeType = baseImageUrl.match(/data:(.*?);/)?.[1] || 'image/jpeg';
    const base64Data = baseImageUrl.split(',')[1];
    parts.push({ inlineData: { data: base64Data, mimeType: mimeType } });
  }
  parts.push({ text: `${prompt} STRICT RULE: Output a CLEAN image only. Remove all text, watermarks, borders, and margins. Ensure the image fills the entire frame.` });

  const imageConfig: any = {
    aspectRatio: aspectRatio === AspectRatio.LANDSCAPE ? "16:9" : aspectRatio === AspectRatio.PORTRAIT ? "9:16" : "1:1"
  };

  if (resolution && modelName === 'gemini-3-pro-image-preview') {
    imageConfig.imageSize = resolution === Resolution.RES_4K ? "4K" : "2K";
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: { parts },
    config: { imageConfig }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("이미지 생성에 실패했습니다. API 키 권한 또는 할당량을 확인해주세요.");
};

export const generateGridImage = async (
  apiKey: string,
  baseImageUrl: string | null, 
  template: string, 
  customScenario?: string,
  resolution?: Resolution
): Promise<string> => {
  const ai = getAiInstance(apiKey);
  const modelName = resolution ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
  
  const parts: any[] = [];
  if (baseImageUrl) {
    const mimeType = baseImageUrl.match(/data:(.*?);/)?.[1] || 'image/jpeg';
    const base64Data = baseImageUrl.split(',')[1];
    parts.push({ inlineData: { data: base64Data, mimeType: mimeType } });
  }

  const prompt = `Create a professional cinematic 16:9 storyboard grid image. 
  Exactly 9 panels in a 3x3 layout.
  STRICT RULE: ULTRA-THIN dividers between panels. NO outer margins. Panels must touch each other almost seamlessly. 
  Theme: ${template}. ${customScenario || ""}
  Maintain character consistency. No text, numbers, or watermarks. Final result in clean 16:9 ratio.`;

  parts.push({ text: prompt });

  const imageConfig: any = { aspectRatio: "16:9" };
  if (resolution && modelName === 'gemini-3-pro-image-preview') {
    imageConfig.imageSize = resolution === Resolution.RES_4K ? "4K" : "2K";
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: { parts },
    config: { imageConfig }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("그리드 이미지 생성 실패");
};

export const editSingleImage = async (
  apiKey: string,
  baseImageUrl: string, 
  instructions: string, 
  aspectRatio?: string,
  resolution?: Resolution
): Promise<string> => {
    const ai = getAiInstance(apiKey);
    const modelName = resolution ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    const mimeType = baseImageUrl.match(/data:(.*?);/)?.[1] || 'image/jpeg';
    const base64Data = baseImageUrl.split(',')[1];

    const imageConfig: any = { aspectRatio: aspectRatio || "1:1" };
    if (resolution && modelName === 'gemini-3-pro-image-preview') {
      imageConfig.imageSize = resolution === Resolution.RES_4K ? "4K" : "2K";
    }

    const response = await ai.models.generateContent({
        model: modelName,
        contents: {
            parts: [
                { inlineData: { data: base64Data, mimeType: mimeType } },
                { text: `${instructions} STRICT RULE: Output a CLEAN image only. No borders, text, watermarks, or UI artifacts. Filled to the edges.` }
            ]
        },
        config: { imageConfig }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
    }
    throw new Error("이미지 편집 실패");
};
