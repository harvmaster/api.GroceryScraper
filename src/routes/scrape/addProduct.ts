import { Request, Response } from 'express';
import { ScrapedProduct } from '../../types';

import isValidScraperKey from '../../auth/isValidScraperKey';
import { isValidProduct } from '../../lib/products/isValidProduct';
import productTagger from '../../lib/product-tagger';

import Product, { ProductInput } from '../../models/Product';
import ProductPriceEvent, { PriceEventInput } from '../../models/ProductPriceEvent';
import { dedupe } from '../../lib/utils/misc';

export type AddProductRequest = {
  body: AddProductBody;
}

export type AddProductBody = {
  product: ScrapedProduct;
  scraperKey: string;
}

const addProduct = async (req: Request<AddProductRequest>, res: Response) => {
  const { product, scraperKey }: AddProductBody = req.body;
  console.log(product)

  // Check if scraperKey is valid
  if (!isValidScraperKey(scraperKey)) {
    return res.status(401).json({ message: 'Invalid scraper key' });
  }

  // Make sure product is valid
  if (!isValidProduct(product)) {
    return res.status(400).json({ message: 'Invalid product' });
  }

  // Return 201
  // We do this here so we don't have to keep requests alive while we process the product
  // We may take a long time to generate tags, so we don't want to keep the scraper waiting
  res.status(201).send()

  // Is product already in the database?
  let productInstance = await Product.findOne({ retailer_product_id: product.retailer_id });

  // If not, create new product
  if (!productInstance) {
    const formattedProduct: ProductInput = {
      retailer_product_id: product.retailer_id,
      retailer_product_url: product.retailer_url,
      retailer_name: product.retailer,
      name: product.name,
      images: product.images,
      tags: [product.category, product.subcategory],
      barcode: product.barcode,
    }

    // Create new product
    productInstance = new Product(formattedProduct);

    // Generate tags
    // Add product to product tagger batch
    const tags = await productTagger.getProductTags(productInstance);
    const uniqueTags = dedupe([...tags, ...productInstance.tags]);
    productInstance.tags = uniqueTags;

    // Save product
    await productInstance.save();
  }

  // Create price event
  const priceEvent: PriceEventInput = {
    product: productInstance._id,
    price: product.price,
    was_price: product.was_price
  }

  const priceEventInstance = new ProductPriceEvent(priceEvent);
  await priceEventInstance.save();
}

export default addProduct;