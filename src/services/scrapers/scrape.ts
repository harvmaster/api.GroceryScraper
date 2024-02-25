import Products from '../../models/Product';
import { IProductDocument } from '../../models/Product';

import PriceEvents from '../../models/ProductPriceEvent';

import { Scraper, Product } from './Scraper';
import { getItemTags, getBulkItemTags } from '../ItemTagger';

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

// New products are products that dont exist in the database
const filterToNewProducts = (scrapedProducts: Product[], existingProducts: IProductDocument[]): Product[] => {
  const existingProductMap = existingProducts.reduce((acc, product) => {
    acc[product.retailer_product_id] = product;
    return acc;
  }, {})

  return scrapedProducts.filter((product) => !existingProductMap[product.retailer_product_id])
}

const getScrapedDocuments = (scrapedProducts: Product[], existingProducts: IProductDocument[]): IProductDocument[] => {
  const existingProductMap = existingProducts.reduce((acc, product) => {
    acc[product.retailer_product_id] = product;
    return acc;
  }, {})

  return scrapedProducts.map((product) => {
    return existingProductMap[product.retailer_product_id] || null;
  }).filter((product) => product !== null)
}

const addProductIds = (products: Product[], existingProducts: IProductDocument[]): (Product & { id: string })[] => {
  const existingProductMap = existingProducts.reduce((acc, product) => {
    acc[product.retailer_product_id] = product;
    return acc;
  }, {})

  return products.map((product) => {
    const existingProduct = existingProductMap[product.retailer_product_id];
    return {
      ...product,
      id: existingProduct?._id as string
    }
  }).filter(product => product.id)
}

const addProductTags = async (products: Product[]): Promise<(Product & { tags: string[] })[]> => {
  const productTags = await getBulkItemTags(products.map((product) => product.name))
  console.log('productTags', productTags)
  return products.map((product, index) => {
    return {
      ...product,
      tags: productTags[product.name]
    }
  })
}

const createManyProducts = async (products: Product[]) => {
  // add tags to the new items
  const productsWithTags = await addProductTags(products)
  console.log(`There are ${productsWithTags.filter((product) => product.tags?.length > 0).length} products with tags`)
  const productsToSave = productsWithTags.map((product) => {
    return {
      retailer_product_id: product.retailer_product_id,
      retailer_product_url: product.retailer_product_url,
      retailer_name: product.retailer_name,
      name: product.name,
      img_url: product.img_url,
      tags: product.tags,
      barcode: product.barcode,
      create_date: new Date()
    }
  })

  return Products.create(productsToSave)
}

const createPriceEvents = async (products: (Product & { id: string })[]) => {
  const priceEvents = products.map((product) => {
    return {
      product_id: product.id,
      price: product.price,
      discounted_from: product.discounted_from,
      create_date: new Date()
    }
  })

  return PriceEvents.create(priceEvents)
}

export const scrape = async (scraper: Scraper) => {
  console.log('Scraping: ', scraper.name)
  const scrapedProducts = await scraper.scrapeAllCategories();
  console.log(`Scraped ${scrapedProducts.length} products from ${scraper.name}`)
  const databaseProducts = await getExistingProducts(scrapedProducts);
  console.log(`Found ${databaseProducts.length} existing products in the database`)
  const existingProducts = addProductIds(scrapedProducts, databaseProducts);
  
  // Save the new products to the DB
  const newProducts = filterToNewProducts(scrapedProducts, databaseProducts);
  console.log(`Found ${newProducts.length} new products`)
  const createdProducts = await createManyProducts(newProducts)
  console.log(`Created ${createdProducts.length} new products`)
  const formattedCreatedProducts = addProductIds(newProducts, createdProducts)
  console.log(`Formatted ${formattedCreatedProducts.length} new products`)

  const allProducts = [...existingProducts, ...formattedCreatedProducts]
  const priceEvents = await createPriceEvents(allProducts)
  console.log(`Created ${priceEvents.length} price events`)

  return {
    products: allProducts,
    priceEvents
  }
}