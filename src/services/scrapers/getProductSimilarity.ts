import trisim from 'trigram-similarity'

export const getProductSimilarity = (product1: string, product2: string): number => {
  const similarity = trisim.compare(product1, product2)
  return similarity
}

export default getProductSimilarity