import { TaggingAgent, ChatCompletionRequest, BatchProductTags } from "../types";
import RateLimiter from "../../RateLimiter";
import { ChatCompletion } from "openai/resources";

import config from '../../../../../config'
const groqApiKey = config.GROQ_API_KEY

class GroqAgent implements TaggingAgent {
  readonly name: string = 'groq';
  private completionsUrl = 'https://api.groq.com/openai/v1/chat/completions';

  private rateLimiter: RateLimiter;

  constructor (private model: string, public contextLength: number) {
    this.rateLimiter = new RateLimiter(10, 1000)
  }

  async getBatchTags (batch: { name: string, description: string, brand: string }[]) {
    
    // Create system Prompt
    const system = `
      Given an array of items, provide a list of tags that describe the individual items.
      Respond in a json format like this { success: boolean, items: { itemName: string[] } }. 
      Be verbose with the amount of tags. Minimum 7 tags per item.
    `

    // Create items string
    const items = batch.map(product => JSON.stringify(product)).join(', ')

    // Create request object for Groq API
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
      temperature: 1
    }

    // Send the rate limited request to the Groq API
    return await this.rateLimiter.add(() => this.sendMessage(request))
  }

  // Send a message to the Groq API
  private async sendMessage (message: ChatCompletionRequest): Promise<BatchProductTags> {
    let body: ChatCompletion

    // Send a message to the Groq API
    try {
      const response = await fetch(this.completionsUrl, {
        method: 'POST',
        body: JSON.stringify(message),
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
        }
      });

      // Parse the response as JSON
      body = await response.json() as ChatCompletion;
    } catch (err) {
      err.message = `Error sending message to Groq (${this.model}): ${err.message}`
      throw err
    }

    // Parse the response and return the items
    const json = JSON.parse(body.choices[0].message.content);
    return json.items
  }
}

export default GroqAgent;