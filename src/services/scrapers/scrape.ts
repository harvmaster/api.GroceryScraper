import Products from '../../models/Product';
import ProductListings from '../../models/ProductListing'

import { Scraper } from './Scraper';
import ColesScraper from './Coles';
import { getItemTags, getBulkItemTags } from '../ItemTagger';
import getProductSimilarity from './getProductSimilarity';
import matchProductWithGPT from './matchProductWithGPT';

const scrape = async (scraper: Scraper) => {
  // const existingProducts = await Products.find({});
  const scrapedProducts = await scraper.scrapeAllCategories();
  const existingProductListings = await ProductListings.find({})

  const existingProductListingIds = existingProductListings.map((productListing) => productListing.supplier_product_id)
  const initialProducts = scrapedProducts.filter((product) => !existingProductListingIds.includes(product.name))

  // Initial Products are products that are not in the database for that specific supplier.
  // An initial product may have a product listing in the database for another supplier, in which case we need to link it. Otherwise we put a new Product in the database

  // Get similar Products from the database
  const existingProducts = await Products.find({})
  const matches = initialProducts.map((initialProduct) => {
    return {
      product: initialProduct,
      similarProducts: existingProducts.filter((existingProduct) => getProductSimilarity(initialProduct.name, existingProduct.name) > 0.8).map(product => {
        return {
          id: product._id,
          name: product.name,
        }
      })
    }
  })

  const productsWithSimilar = matches.filter((match) => match.similarProducts.length > 0)
  const productsWithoutSimilar = matches.filter((match) => match.similarProducts.length === 0).map(product => product.product)

  // If there are no similar products, create a new product
  // if (!similarMatches.length) {
  //   createProduct()
  // }

  // If there are similar products, send them to chatGPT to decide what the best match is
  const chatGPTMatchesPromises = productsWithSimilar.map(async (productWithSimilar) => matchProductWithGPT(productWithSimilar.product, productWithSimilar.similarProducts))
  const chatGPTMatches = await Promise.all(chatGPTMatchesPromises)

  // filter based on whether there was a match
  const matchedProducts = chatGPTMatches.filter((match) => match.matched)
  productsWithoutSimilar.push(...chatGPTMatches.filter((match) => !match.matched).map((match) => match.product))

  // Get existing products and create a productEvent 
  const existingNames = existingProducts.map((product) => product.name)

  const 

  // Get the new products and add them to the database
  const toCreateProducts = scrapedProducts.filter((product) => !existingProducts.find((existingProduct) => existingProduct.name === product.name))
  
  // Add tags to the new products
  const tags = await getBulkItemTags(toCreateProducts.map((product) => product.name))
  const taggedProducts = Object.keys(tags).map((key) => {
    const product = toCreateProducts.find((product) => product.name === key)
    if (product) {
      product.tags = tags[key]
    }
    return product
  })

  // Save new products to the database
  // const newProductPromises = taggedProducts.map(async (product) => {
  //   const newProduct = {
  //     name: product.name,
  //     img_url: product.img_url,
  //     tags: product.tags
  //   }
  //   const newProduct = new Products(product)
  //   return newProduct.save()
  // })

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