import OpenAIAgent from "./openai-agent";

export const gpt4o_Mini = new OpenAIAgent('gpt-4o-mini', 128000);
export const gpt4o = new OpenAIAgent('gpt-4o', 128000);
export const gpt4_Turbo = new OpenAIAgent('gpt-4-turbo', 128000);
export const gpt3_5_Turbo = new OpenAIAgent('gpt-3.5-turbo', 32000);