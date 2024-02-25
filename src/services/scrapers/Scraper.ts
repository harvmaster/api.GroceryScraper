export interface Product {
  name: string
  price: number
  discounted_from: number
  img_url: string
  retailer_name: string;
  retailer_product_url: string
  retailer_product_id: string
  barcode? : string
  tags?: string[]
}

export interface Scraper {
  name: string
  scrapeAllCategories: () => Promise<Product[]>
}