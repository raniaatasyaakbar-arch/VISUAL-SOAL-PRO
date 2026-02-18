import { GoogleGenAI } from "@google/genai";
import { GeneratePromptParams, GenerateImageParams, VisualStyle, PromptResult } from "../types";

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const STYLE_PROMPTS: Record<VisualStyle, string> = {
  [VisualStyle.THREE_D]: "3D render, Pixar style animation, educational illustration, soft volumetric lighting, vibrant but balanced colors, high fidelity 8k.",
  [VisualStyle.REALISTIC]: "Cinematic documentary photography, national geographic style, highly detailed, 8k resolution, sociology context.",
  [VisualStyle.FLAT]: "Corporate memphis art style, modern vector illustration, flat design, clean lines, educational infographic style, pastel colors.",
  [VisualStyle.SKETCH]: "Academic pencil sketch, architectural drawing style, graphite on paper, detailed shading, cross-hatching, black and white."
};

export const generateVisualPrompt = async (params: GeneratePromptParams): Promise<PromptResult> => {
  const { input, style, ratio } = params;

  const systemInstruction = `
    Role: Expert Educational Illustrator & Sociologist.
    Task: Convert the provided Sociology stimulus (text) into a precise visual description (prompt) for an AI image generator.
    
    Style: ${STYLE_PROMPTS[style]}
    Aspect Ratio: ${ratio}
    
    Steps:
    1. Analyze the input to identify key sociological concepts.
    2. Formulate a visual scene (concrete, avoiding abstract symbols).
    3. Construct a detailed English prompt.
    
    Output JSON format strictly:
    {
      "analysis": "Bahasa Indonesia explanation",
      "visualPrompt": "English image prompt"
    }
  `;

  try {
    // Using gemini-3-flash-preview for better reasoning and JSON adherence
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: input,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json", 
        temperature: 0.3,
      },
    });

    const text = response.text;
    
    if (!text) {
      throw new Error("Model response was empty. Please try again.");
    }

    // ROBUST PARSING: Extract JSON object from anywhere in the string
    // This handles cases where the model adds markdown code blocks or conversational text
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("Format respon tidak valid (JSON tidak ditemukan).");
    }

    const jsonString = text.substring(jsonStart, jsonEnd + 1);

    try {
      return JSON.parse(jsonString) as PromptResult;
    } catch (e) {
      console.error("JSON Parse Error:", e, "Raw Text:", text);
      throw new Error("Gagal membaca struktur data dari AI.");
    }

  } catch (error: any) {
    console.error("Error generating prompt:", error);
    throw new Error(error.message || "Terjadi kesalahan saat analisis teks.");
  }
};

export const generateImage = async (params: GenerateImageParams): Promise<string> => {
  const { prompt, ratio } = params;

  try {
    // Using gemini-2.5-flash-image for reliable image generation
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: ratio,
        }
      },
    });

    // Iterate through parts to find the image data
    // The model may return text parts alongside image parts
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("Model berhasil dipanggil tetapi tidak mengembalikan data gambar.");
  } catch (error: any) {
    console.error("Error generating image:", error);
    // Extract meaningful error message if possible
    const msg = error.message || "Gagal membuat gambar.";
    if (msg.includes("404")) {
      throw new Error("Model gambar sedang sibuk atau tidak ditemukan. Silakan coba sesaat lagi.");
    }
    throw new Error(msg);
  }
};