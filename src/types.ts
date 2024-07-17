export type ScrapedProduct = {
  retailer_id: string;
  retailer_url: string;
  barcode: string;
  name: string;
  brand: string;
  description: string;
  images: string[];
  price: number;
  was_price: number;

  unit: string;

  category: string;
  subcategory: string;
}