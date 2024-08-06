export interface TaggingAgent {
  readonly name: string;
  readonly contextLength: number;

  getBatchTags (products: any[]): Promise<{ [key: string]: string[] }>;
}

export type ChatCompletionRequest = {
  model: string;
  messages: { role: string, content: string }[];
  stream?: boolean;
  temperature?: number;
}

export type BatchProductTags = {
  [key: string]: string[];
}