import { Request, Response } from 'express';
import isValidScraperKey from '../../auth/isValidScraperKey';
import { isValidProduct } from '../../lib/products/isValidProduct';
import Product from '../../models/Product';

const addProduct = async (req: Request, res: Response) => {
  const { product, scraperKey } = req.body;

  // Check if scraperKey is valid
  if (!isValidScraperKey(scraperKey)) {
    return res.status(401).json({ message: 'Invalid scraper key' });
  }

  // Make sure product is valid
  if (!isValidProduct(product)) {
    return res.status(400).json({ message: 'Invalid product' });
  }

  // Is product already in the database?
  let productInstance = await Product.findOne({ barcode: product.barcode });
  if (!productInstance) {
    // Create new product
    productInstance = new Product(product);
  }

}

export default addProduct;