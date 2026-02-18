export enum VisualStyle {
  THREE_D = "3D",
  REALISTIC = "REALISTIC",
  FLAT = "FLAT",
  SKETCH = "SKETCH"
}

export enum AspectRatio {
  LANDSCAPE = "16:9",
  SQUARE = "1:1",
  PORTRAIT = "9:16"
}

export interface PromptResult {
  analysis: string;
  visualPrompt: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  input: string;
  style: VisualStyle;
  ratio: AspectRatio;
  analysis: string;
  visualPrompt: string;
  imageBase64?: string;
}

export interface GeneratePromptParams {
  input: string;
  style: VisualStyle;
  ratio: AspectRatio;
}

export interface GenerateImageParams {
  prompt: string;
  ratio: AspectRatio;
}