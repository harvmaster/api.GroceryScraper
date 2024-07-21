export type ScrapedProduct = {
  retailer: string; // Coles, Woolworths, etc.
  retailer_id: string; // Product ID on the retailer's website
  retailer_url: string; // URL of the product on the retailer's website
  barcode?: string; // Barcode of the product

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