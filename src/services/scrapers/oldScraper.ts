import Products from '../../models/Product';
import ProductListings from '../../models/ProductListing'

import { Scraper } from './Scraper';
import ColesScraper from './Coles';
import { getItemTags, getBulkItemTags } from '../ItemTagger';
import getProductSimilarity from './getProductSimilarity';
import matchProductWithGPT from './matchProductWithGPT';

const getExistingProductListingIds = async () => {
  const existingProductListings = await ProductListings.find({});
  return existingProductListings.map((productListing) => productListing.supplier_product_id);
}

const getInitialProducts = (scrapedProducts, existingProductListingIds) => {
  return scrapedProducts.filter((product) => !existingProductListingIds.includes(product.name));
}

const getMatches = async (initialProducts) => {
  const existingProducts = await Products.find({});
  return initialProducts.map((initialProduct) => {
    return {
      product: initialProduct,
      similarProducts: existingProducts.filter((existingProduct) => getProductSimilarity(initialProduct.name, existingProduct.name) > 0.8).map(product => {
        return {
          id: product._id,
          name: product.name,
        }
      })
    }
  });
}

const separateMatches = (matches) => {
  const productsWithSimilar = [];
  const productsWithoutSimilar = [];
  matches.forEach((match) => {
    if (match.similarProducts.length > 0) {
      productsWithSimilar.push(match);
    } else {
      productsWithoutSimilar.push(match.product);
    }
  });
  return { productsWithSimilar, productsWithoutSimilar };
}

const getChatGPTMatches = async (productsWithSimilar) => {
  const chatGPTMatchesPromises = productsWithSimilar.map(async (productWithSimilar) => matchProductWithGPT(productWithSimilar.product, productWithSimilar.similarProducts));
  return await Promise.all(chatGPTMatchesPromises);
}

const separateChatGPTMatches = (chatGPTMatches) => {
  const matchedProducts = [];
  const unmatchedProducts = [];
  chatGPTMatches.forEach((match) => {
    if (match.match) {
      matchedProducts.push(match);
    } else {
      unmatchedProducts.push(match.product);
    }
  });
  return { matchedProducts, unmatchedProducts };
}

const getTaggedProducts = async (productsWithoutSimilar) => {
  const tags = await getBulkItemTags(productsWithoutSimilar.map((product) => product.name));
  return Object.keys(tags).map((key) => {
    const product = productsWithoutSimilar.find((product) => product.name === key);
    if (product) {
      product.tags = tags[key];
    }
    return product;
  });
}

const createNewProducts = async (taggedProducts) => {
  const newProductPromises = taggedProducts.map(async (product) => {
    const newProduct = new Products(product);
    return newProduct.save();
  });
  return await Promise.all(newProductPromises);
}

const createNewProductListings = async (taggedProducts, scraper) => {
  const newProductListingPromises = taggedProducts.map(async (product) => {
    const newProductListing = new ProductListings({
      name: product.name,
      img_url: product.img_url,
      supplier_product_id: product.supplier_product_id,
      supplier_product_url: product.supplier_product_url,
      tags: product.tags,

      supplier_name: scraper.name
    });
    return newProductListing.save();
  });
  return await Promise.all(newProductListingPromises);
}

const scrape = async (scraper: Scraper) => {
  try {
    const scrapedProducts = await scraper.scrapeAllCategories();
    const existingProductListingIds = await getExistingProductListingIds();
    const initialProducts = getInitialProducts(scrapedProducts, existingProductListingIds);
    const matches = await getMatches(initialProducts);
    const { productsWithSimilar, productsWithoutSimilar } = separateMatches(matches);
    const chatGPTMatches = await getChatGPTMatches(productsWithSimilar);
    const { matchedProducts, unmatchedProducts } = separateChatGPTMatches(chatGPTMatches);
    productsWithoutSimilar.push(...unmatchedProducts);
    const taggedProducts = await getTaggedProducts(productsWithoutSimilar);
    const newProducts = await createNewProducts(taggedProducts);
    const newProductListings = await createNewProductListings(taggedProducts, scraper);
    // Create Product Price Event
  } catch (error) {
    console.error(`Failed to scrape: ${error}`);
  }
}