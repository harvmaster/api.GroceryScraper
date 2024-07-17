import { ScrapedProduct } from '../../types'

export const isValidProduct = (product: any): boolean => {
  if (!product) return false

  // retailer_id
  if (!product.retailer_id) return false
  if (typeof product.retailer_id !== 'string') return false

  // retailer_url
  if (!product.retailer_url) return false
  if (typeof product.retailer_url !== 'string') return false

  // barcode
  if (!product.barcode) return false
  if (typeof product.barcode !== 'string') return false

  // name
  if (!product.name) return false
  if (typeof product.name !== 'string') return false

  // brand
  if (!product.brand) return false
  if (typeof product.brand !== 'string') return false

  // description
  if (!product.description) return false
  if (typeof product.description !== 'string') return false

  // images
  if (!product.images) return false
  if (!Array.isArray(product.images)) return false

  // price
  if (!product.price) return false
  if (typeof product.price !== 'number') return false

  // was_price
  if (!product.was_price) return false
  if (typeof product.was_price !== 'number') return false

  // unit
  if (!product.unit) return false
  if (typeof product.unit !== 'string') return false

  // category
  if (!product.category) return false
  if (typeof product.category !== 'string') return false

  // subcategory
  if (!product.subcategory) return false
  if (typeof product.subcategory !== 'string') return false

  return true
}