export interface Product {
  name: string
  price: number
  discounted_from: number
  img_url: string
  supplier_product_url: string
  supplier_product_id: string
  tags?: string[]
}

export interface Scraper {
  name: string
  scrapeAllCategories: () => Promise<Product[]>
  // scrapeCategory: (browser, category_url: string) => Promise<Product[]>
  // scrapeURL: (browser, url: string) => Promise<Product[]>
}