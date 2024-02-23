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
    const browser = await puppeteer.launch()
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
    // const categories = categoriesUnfiltered.filter((cat) => cat.url !== null && cat.name !== 'Specials').slice(2, 3)
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
    const products = await this.#rateLimit.add<Product[]>(async () => {
      console.log('Scraping', url)
      const page = await browser.newPage()

      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (req.resourceType() === 'image' || req.resourceType() === 'script') return req.abort();
        return req.continue();
      });

      await page.goto(url)
      
      const el = await page.$$('[data-testid="product-tile"]')
      const products = await Promise.all(el.map(async (div) => {
        // Item price
        const priceValue = await div.$('.price__value')
        const priceTxt = await priceValue?.getProperty('textContent')
        const price = await priceTxt?.jsonValue()
        
        // Item name
        const titleValue = await div.$('.product__title')
        const titleTxt = await titleValue?.getProperty('textContent')
        const title = await titleTxt?.jsonValue()

        // Item link. This is used to get the item ID from coles
        const linkValue = await div.$('.product__link')
        const linkTxt = await linkValue?.getProperty('href')
        const link = await linkTxt?.jsonValue() as string

        const id = link?.split('-').pop()

        // Get the image. Image is lazy loaded so we get it from the noscript tag
        const noScriptTag = await div.$('noscript')
        const imgData = await noScriptTag?.evaluate((el) => {
          const imgTag = el.innerHTML.match(/<img.*?src="(.*?)"/)
          return imgTag?.[1]
        })
        const imgSrc = imgData?.split('url=')[1]
        const imgSrcDecoded = decodeURIComponent(imgSrc || '')
        const img = imgSrcDecoded?.split('&')[0]

        // Price before discount. This doesnt always exist
        const wasElement = await div.$('.price__was')
        const wasTxt = await wasElement?.getProperty('textContent')
        const was = await wasTxt?.jsonValue()

        // These 2 can be removed
        // Replace every non-digit character with an empty string
        const priceDigits = price?.replace(/\D/g, '') || '0'
        const priceNum = (parseFloat(priceDigits)/100)
        const priceNumFixed = priceNum?.toFixed(2)

        // Replace every non-digit character with an empty string
        const wasDigits = was?.replace(/\D/g, '') || '0'
        const wasNum = (parseFloat(wasDigits)/100)
        const wasNumFixed = wasNum?.toFixed(2)

        return {
          name: title,
          price: priceNum,
          discounted_from: wasNum || priceNum,
          img_url: img,
          supplier_product_url: link,
          supplier_product_id: id
        }
      }))

      return products
    })

    return products
  }

  async getBarcode (product: Product): Promise<string> {
    try {
      const { data } = await axios.get(`https://barcodes.groceryscraper.mc.hzuccon.com/barcode?product=${product.supplier_product_id}`)
      return data
    } catch (err) {
      // console.error(err)
      return ''
    }
  }
}

export default ColesScraper