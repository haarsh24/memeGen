import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface MemeAnalysis {
  objects: string[];
  emotion: string;
  scene: string;
}

export interface MemeCaptions {
  captions: string[];
}

export async function analyzeImage(base64Image: string, mimeType: string): Promise<MemeAnalysis> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Analyze this image for a meme generator. 
  Identify the main objects, the primary emotion or vibe, and a brief description of the scene.
  Return the result in JSON format.`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          objects: { type: Type.ARRAY, items: { type: Type.STRING } },
          emotion: { type: Type.STRING },
          scene: { type: Type.STRING }
        },
        required: ["objects", "emotion", "scene"]
      }
    }
  });

  return JSON.parse(response.text || "{}") as MemeAnalysis;
}

export async function generateCaptions(analysis: MemeAnalysis, tone: string): Promise<string[]> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Generate 5 funny, viral-style meme captions based on this scene analysis:
  Objects: ${analysis.objects.join(', ')}
  Emotion: ${analysis.emotion}
  Scene: ${analysis.scene}
  
  Tone: ${tone}
  
  The captions should be short, relatable, and fit the classic meme format. 
  Return them as a JSON array of strings.`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  return JSON.parse(response.text || "[]") as string[];
}
