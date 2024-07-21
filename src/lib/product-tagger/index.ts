import OpenAI from "openai";
import config from '../../../config'
const openaiApiKey = config.openaiApiKey

import { ProductProps } from "../../models/Product";

const MAX_BATCH_SIZE = 30;

export class ProductTagger {
  private products: { product: ProductProps, done: (product: string[]) => void }[] = []
  private timer: NodeJS.Timeout | null = null;

  getProductTags(product: ProductProps): Promise<string[]> {
    return new Promise((resolve) => {
      this.products.push({ product, done: resolve })

      if (this.products.length > 30) {
        this.processProductBatch()
        this.timer = null;
      }
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
    const openaiClient = new OpenAI({
      apiKey: openaiApiKey,
    })

    const system = `
      Given an array of items, provide a list of tags that describe the individual items.
      Respond in a json format like this { success: boolean, items: { itemName: string[] } }. 
      Be verbose with the amount of tags. Minimum 7 tags per item.
    `

    const items = batch.map(product => JSON.stringify(product)).join(', ')
    
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
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
      temperature: 0.4,
      max_tokens: 8192,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    try {
      const json = JSON.parse(response.choices[0].message.content);
      return json.items
    } catch (e) {
      console.error(e)
      return {}
    }
  }
}

const productTagger = new ProductTagger();

export default productTagger;