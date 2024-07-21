import { ScrapedProduct } from '../../types'

const DEBUG = true
const debug = (str: string) => {
  if (DEBUG) console.log(str)
}

export const isValidProduct = (product: any): boolean => {
  if (!product) return false

  // retailer_id
  if (!product.retailer_id) return false
  if (typeof product.retailer_id !== 'string') return false
  debug('retailer_id')

  // retailer_url
  if (!product.retailer_url) return false
  if (typeof product.retailer_url !== 'string') return false
  debug('retailer_url')

  // name
  if (!product.name) return false
  if (typeof product.name !== 'string') return false
  debug('name')

  // brand
  if (!product.brand) return false
  if (typeof product.brand !== 'string') return false
  debug('brand')

  // description
  if (!product.description) return false
  if (typeof product.description !== 'string') return false
  debug('description')

  // images
  if (!product.images) return false
  if (!Array.isArray(product.images)) return false
  debug('images')

  // price
  // if (product.price !== undefined) return false
  // if (typeof product.price !== 'number') return false
  // debug('price')

  // was_price
  // if (product.was_price) return false
  // if (typeof product.was_price !== 'number') return false

  // category
  // if (!product.category) return false
  // if (typeof product.category !== 'string') return false

  // subcategory
  // if (!product.subcategory) return false
  // if (typeof product.subcategory !== 'string') return false

  return true
}