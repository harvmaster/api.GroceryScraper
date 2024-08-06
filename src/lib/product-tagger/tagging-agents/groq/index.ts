import GroqAgent from "./groq-agent";

export const llama3_1_405b = new GroqAgent('llama-3.1-405b-reasoning', 16000);
export const llama3_1_70b = new GroqAgent('llama-3.1-70b-versatile', 8000);
export const llama3_1_8b = new GroqAgent('llama-3.1-8b-instant', 8000);