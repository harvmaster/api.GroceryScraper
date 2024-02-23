import Products from '../../models/Product';
import { IProductDocument } from '../../models/Product';

import { Scraper, Product } from './Scraper';
import ColesScraper from './Coles';
import { getItemTags, getBulkItemTags } from '../ItemTagger';
import getProductSimilarity from './getProductSimilarity';
import matchProductWithGPT from './matchProductWithGPT';

interface ProductMatch {
  product: Product;
  similarProducts: Product[];
}

const getExistingProducts = async (products) => {
  const productIds = products.map((product) => product.retailer_product_id);
  const existingProducts = await Products.find<IProductDocument>({ retailer_product_id: { $in: productIds } });
  return existingProducts;
}

// similar products are products with the same product_id and retailer
const filterToExistingProducts = (scrapedProducts: Product[], existingProducts: IProductDocument[]): Product[] => {
  const existingProductMap = existingProducts.reduce((acc, product) => {
    acc[product.retailer_product_id] = product;
    return acc;
  }, {})

  return scrapedProducts.filter((product) => existingProductMap[product.retailer_product_id])
}

const filterToNewProducts = (scrapedProducts: Product[], existingProducts: IProductDocument[]): Product[] => {
  const existingProductMap = existingProducts.reduce((acc, product) => {
    acc[product.retailer_product_id] = product;
    return acc;
  }, {})

  return scrapedProducts.filter((product) => !existingProductMap[product.retailer_product_id])
}

const scrape = async (scraper: Scraper) => {
  const scrapedProducts = await scraper.scrapeAllCategories();
  const databaseProducts = await getExistingProducts(scrapedProducts);
  const existingProducts = filterToExistingProducts(scrapedProducts, databaseProducts);
  const newProducts = filterToNewProducts(scrapedProducts, databaseProducts);
  
}

const run = async () => {
  const colesScraper = new ColesScraper();
  const products = await colesScraper.scrapeAllCategories();
  console.log(products)

  // const singleTestItems = products.slice(0, 5).map(async (product) => {
  //   const tags = await getItemTags(product.name)
  //   console.log(tags)
  //   return {
  //     name: product.name,
  //     tags
  //   }
  // })

  // const singleTests = await Promise.all(singleTestItems)

  // const bulkTestItems = products.slice(0, 25).map((product) => product.name)
  // const bulkTags = await getBulkItemTags(bulkTestItems)

  // console.log(singleTests)
  // console.log(bulkTags)

}

run()