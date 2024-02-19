interface Product {
  name: string
  price: number
  discounted_from: number
  img_url: string
}

type ProductCallback = (product: Product) => Promise<void>

export interface Scraper {
  scrapeAllCategories: () => Promise<Product[]>
  scrapeCategory: (browser, category_url: string) => Promise<Product[]>
  scrapeURL: (browser, url: string) => Promise<Product[]>
}