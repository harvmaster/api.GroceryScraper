import mongoose from 'mongoose'
import { Product } from './Scraper'

interface ProductCrucialInfo {
  id: string | mongoose.Schema.Types.ObjectId
  name: string
}

interface GPTMatch {
  product: Product
  match: ProductCrucialInfo
}

export const matchProductWithGPT = async (product: Product, similar: ProductCrucialInfo[] ): Promise<GPTMatch> => {
//   const response = await gpt.query(product.name)
//   return response
  return {
    product,
    match: similar[0]
  }
}

export default matchProductWithGPT;