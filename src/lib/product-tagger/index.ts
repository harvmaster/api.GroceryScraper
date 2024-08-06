import { ProductProps } from "../../models/Product";
import { TaggingAgent } from './tagging-agents/types';

import { gpt4o_Mini } from "./tagging-agents/openai";

export class ProductTagger {
  private products: { product: ProductProps, done: (product: string[]) => void }[] = []
  private timer: NodeJS.Timeout | null = null;

  MAX_BATCH_SIZE: number;

  constructor(private taggingAgent: TaggingAgent) {
    this.MAX_BATCH_SIZE = taggingAgent.contextLength / 200;
  }

  getProductTags(product: ProductProps): Promise<string[]> {
    return new Promise((resolve) => {
      this.products.push({ product, done: resolve })

      // If the batch is full, process it immediately
      if (this.products.length > this.MAX_BATCH_SIZE) {
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
    // determine the size of the batch. If there are less than (MAX_BATCH_SIZE) products, use the length of the products array
    const batchSize = Math.min(this.products.length, this.MAX_BATCH_SIZE);

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

  // Use the tagging agent to get tags for a batch of products
  private async callBatchAPI(batch: { name: string, description: string, brand: string }[]) {
    try {
      const response = await this.taggingAgent.getBatchTags(batch)
      console.log(response)
      return response
    } catch (e) {
      console.error(e)
      return {}
    }
  }
}

const productTagger = new ProductTagger(gpt4o_Mini);

export default productTagger;