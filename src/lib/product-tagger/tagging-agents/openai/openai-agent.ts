import { OpenAI } from 'openai';
import { ChatCompletion, ChatCompletionCreateParamsNonStreaming } from "openai/resources";

import RateLimiter from '../../RateLimiter';

import config from '../../../../../config';
import { BatchProductTags } from '../types';
const openaiApiKey = config.openaiApiKey;

class OpenAIAgent {
  readonly name: string = 'openai';
  private client: OpenAI;

  private rateLimiter: RateLimiter;

  constructor(private model: string, public contextLength: number) {
    this.client = new OpenAI({ apiKey: openaiApiKey });

    // Create rate limiter for max 1 request per second and 10 in parallel
    this.rateLimiter = new RateLimiter(10, 1000);
  }

  getBatchTags(batch: { name: string, description: string, brand: string }[]) {
    // Create system Prompt
    const system = `
      Given an array of items, provide a list of tags that describe the individual items.
      Respond in a json format like this { success: boolean, items: { itemName: string[] } }. 
      Be verbose with the amount of tags. Minimum 7 tags per item.
    `

    // Create items string
    const items = batch.map(product => JSON.stringify(product)).join(', ')

    // Create request object for OpenAI API
    const request = {
      model: this.model,
      messages: [
        {
          role: "system",
          content: system
        },
        {
          role: "user",
          content: `[${items}]`
        },
      ],
      stream: false,
      temperature: 1.3,
      response_format: { type: "json_object" }
    }

    // Send the rate limited request to the OpenAI API
    return this.rateLimiter.add(() => this.sendMessage(request as ChatCompletionCreateParamsNonStreaming))
  }

  private async sendMessage(message: ChatCompletionCreateParamsNonStreaming): Promise<BatchProductTags> {
    let body: ChatCompletion

    // Send a message to the OpenAI API
    try {
      const response = await this.client.chat.completions.create(message);
      body = response
    } catch (error) {
      console.error('Error sending message to OpenAI:', error);
      throw error;
    }

    // validate the response
    if (!body.choices) {
      throw new Error('Invalid response from OpenAI');
    }

    if (!body.choices[0].message) {
      throw new Error('Invalid response from OpenAI');
    }

    // Parse the response and return the items
    const json = JSON.parse(body.choices[0].message.content);
    return json.items
  }

}

export default OpenAIAgent;