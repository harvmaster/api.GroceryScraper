import puppeteer from 'puppeteer';
import { Browser, Page } from 'puppeteer';
import axios from 'axios'

import { Scraper, Product } from '../Scraper';
import RateLimiter from '../../RateLimiter';

const COLES_URL = 'https://www.coles.com.au/browse'
const SPEED_LIMIT = 20

class ColesScraper implements Scraper {

  name: string = 'Coles'
  #rateLimit: RateLimiter

  constructor () {
    this.#rateLimit = new RateLimiter(SPEED_LIMIT, 5)
  }

  async scrapeAllCategories (): Promise<Product[]> {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: '/usr/bin/google-chrome-stable',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    })
    const page = await browser.newPage()
    await page.goto(COLES_URL)

    const categoryCardElements = await page.$$('[data-testid="category-card"]')
    const categoriesUnfiltered = await Promise.all(categoryCardElements.map(async (el) => {
      const href = await el?.getProperty('href')
      const url = await href?.jsonValue() as string
      const category = await el?.getProperty('textContent').then(txt => txt.jsonValue())
      return { name: category, url }
    }))

    const categories = categoriesUnfiltered.filter((cat) => cat.url !== null && cat.name !== 'Specials')
    // const categories = categoriesUnfiltered.filter((cat) => cat.url !== null && cat.name !== 'Specials').slice(5, 6)
    console.log(categories)

    const categoryPromises = categories.map(async (category) => {
      const products = await this.scrapeCategory(browser, category.url)
      return products
    })

    const productsByCategory = await Promise.all(categoryPromises)
    const products = productsByCategory.flat()

    await browser.close()

    console.log(`Filling in barcodes for ${products.length} products`)
    const productsWithBarcodes = await Promise.all(products.map(async (product) => {
      const barcode = await this.getBarcode(product)
      return { ...product, barcode }
    }))

    return productsWithBarcodes
  }

  async scrapeCategory (browser: Browser, category_url: string): Promise<Product[]> {
    // const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto(category_url)

    const paginationElement = await page.$('[data-testid="pagination"]')
    const ulElement = await paginationElement?.$('ul')
    
    const maxPages = 1
    // const maxPages = await ulElement?.evaluate((el) => {
    //   const childCount = el.childElementCount
    //   const lastPage = el.children[childCount-2]
    //   const lastPageNum = lastPage?.textContent
    //   return parseInt(lastPageNum)
    // })

    const pagePromises: Promise<Product[]>[] = []
    pagePromises.push(this.scrapeURL(browser, category_url))
    for (let i = 2; i <= maxPages; i++) {
      const pageURL = `${category_url}?page=${i}`
      pagePromises.push(this.scrapeURL(browser, pageURL))
    }

    const productByPage = await Promise.all(pagePromises)
    const products = productByPage.flat()

    return products
  }

  async scrapeURL (browser: Browser, url: string): Promise<Product[]> {
    const products = await this.#rateLimit.add<Product[]>(async (): Promise<Product[]> => {
      console.log('Scraping', url)
      const page = await browser.newPage()

      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (req.resourceType() === 'image') return req.abort();
        return req.continue();
      });

      await page.goto(url)

      let productList: Product[] = []
      try {
        const data = await page.evaluate(() => {
          return eval('this.colDataState.b.data.shop.tiles')
        })
  
        const tiles = data.filter(tile => tile._type == 'PRODUCT')
  
        const COLES_IMAGE_BASE_URL = 'https://www.coles.com.au/_next/image?url=https://productimages.coles.com.au/productimages'
        productList = tiles.map((product: any) => {
          const productUrl = `${product.brand}-${product.name}-${product.size}-${product.id}`.toLocaleLowerCase().replace(/ /g, '-')
          // if (!product.pricing || !product.pricing.now) console.log(product)
          return {
            name: `${product.brand} ${product.name} | ${product.size}`,
            price: product.pricing?.now || 0,
            discounted_from: product.pricing?.was || product.pricing?.now || 0,
            img_url: `${COLES_IMAGE_BASE_URL}${product.imageUris[0]?.uri}&w=256&q=90`,
            retailer_name: 'Coles',
            retailer_product_url: `https://www.coles.com.au/product/${productUrl}`,
            retailer_product_id: product.id
          }
        })
      } catch (err) {
        console.error(err)
        console.log(`${url} failed to scrape`)
      }

      return productList
    })

    return products
  }

  async getBarcode (product: Product): Promise<string> {
    try {
      const { data } = await axios.get(`https://barcodes.groceryscraper.mc.hzuccon.com/barcode?product=${product.retailer_product_id}`)
      return data
    } catch (err) {
      // console.error(err)
      return ''
    }
  }
}

export default ColesScraper