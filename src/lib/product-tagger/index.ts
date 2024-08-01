import config from '../../../config'
const groqApiKey = config.GROQ_API_KEY

import { ChatCompletion } from 'openai/resources';

import RateLimiter from "./RateLimiter";

import { ProductProps } from "../../models/Product";

const MAX_BATCH_SIZE = 200;

export class ProductTagger {
  private products: { product: ProductProps, done: (product: string[]) => void }[] = []
  private timer: NodeJS.Timeout | null = null;

  getProductTags(product: ProductProps): Promise<string[]> {
    return new Promise((resolve) => {
      this.products.push({ product, done: resolve })

      // If the batch is full, process it immediately
      if (this.products.length > MAX_BATCH_SIZE) {
        this.processProductBatch()
        this.timer = null;
      }

      // else wait for 1000ms before processing the next batch. This ensures we arent left waiting on an incomplete batch
      else if (!this.timer) {
        this.timer = setTimeout(() => {
          this.processProductBatch()
          this.timer = null;
        }, 1000)
      }
    })
  }

  private async processProductBatch() {
    // determine the size of the batch. If there are less than 30 products, use the length of the products array
    const batchSize = Math.min(this.products.length, MAX_BATCH_SIZE);

    // Get the products to process
    const products = this.products.splice(0, batchSize);

    // Create a batch of products to send to the API
    const batch = products.map(queuedProduct => {
      const product = queuedProduct.product;

      return {
        name: product.name,
        description: product.description,
        brand: product.brand
      }
    })

    // Call the API to process the batch
    const tags = await this.callBatchAPI(batch)

    // Assign the tags to the products
    products.forEach((queuedProduct, i) => {
      const product = queuedProduct.product;
      const tagsForProduct = tags[product.name] || [];
      queuedProduct.done(tagsForProduct);
    })
  }

  private async callBatchAPI(batch: { name: string, description: string, brand: string }[]) {
    
    const groqApi = 'https://api.groq.com/openai/v1/';

    const system = `
      Given an array of items, provide a list of tags that describe the individual items.
      Respond in a json format like this { success: boolean, items: { itemName: string[] } }. 
      Be verbose with the amount of tags. Minimum 7 tags per item.
    `

    const items = batch.map(product => JSON.stringify(product)).join(', ')

    let body: ChatCompletion;
    try {
      const response = await fetch(`${groqApi}/chat/completions`, {
        method: 'POST',
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
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
        }),
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
        }
      });

      body = await response.json() as ChatCompletion;
    } catch (err) {
      console.error(err);
      return {};
    }

    try {
      const json = JSON.parse(body.choices[0].message.content);
      return json.items
    } catch (e) {
      console.error(e)
      return {}
    }
  }
}

const productTagger = new ProductTagger();

export default productTagger;