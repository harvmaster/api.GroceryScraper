import Products from '../../models/Product';

import { Scraper } from './Scraper';
import ColesScraper from './Coles';
import { getItemTags, getBulkItemTags } from '../ItemTagger';

const scrape = async (scraper: Scraper) => {
  // const existingProducts = await Products.find({});
  const scrapedProducts = await scraper.scrapeAllCategories();
  
  // Get existing products and create a productEvent 
  const existingProducts = await Products.find(scrapedProducts.map((product) => ({ name: product.name })))

  // Get the new products and add them to the database
  const toCreateProducts = scrapedProducts.filter((product) => !existingProducts.find((existingProduct) => existingProduct.name === product.name))
  
  // Add tags to the new products
  

  // Save new products to the database
  const newProductPromises = toCreateProducts.map(async (product) => {

  })

}


const run = async () => {
  const colesScraper = new ColesScraper();
  const products = await colesScraper.scrapeAllCategories();
  console.log(products)

  const singleTestItems = products.slice(0, 5).map(async (product) => {
    const tags = await getItemTags(product.name)
    console.log(tags)
    return {
      name: product.name,
      tags
    }
  })

  const singleTests = await Promise.all(singleTestItems)

  const bulkTestItems = products.slice(0, 25).map((product) => product.name)
  const bulkTags = await getBulkItemTags(bulkTestItems)

  console.log(singleTests)
  console.log(bulkTags)

}

run()