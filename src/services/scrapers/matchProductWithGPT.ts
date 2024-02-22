import mongoose from 'mongoose'

interface Product {
  name: string
  price: number
  discounted_from: number
  img_url: string
  tags?: string[]
}

interface ProductCrucialInfo {
  id: string | mongoose.Schema.Types.ObjectId
  name: string
}

interface GPTMatch {
  product: Product
  match: ProductCrucialInfo
}

export const matchProductWithGPT = async (product: Product, similar: ProductCrucialInfo[] ): Promise<GPTMatch> => {
  const response = await gpt.query(product.name)
  return response
}

export default matchProductWithGPT;