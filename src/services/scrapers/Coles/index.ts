import puppeteer from 'puppeteer';
import { Browser } from 'puppeteer';
import { Scraper } from '../Scraper';
import RateLimiter from '../../RateLimiter';

interface Product {
  name: string
  price: number
  discounted_from: number
  img_url: string
}

const COLES_URL = 'https://www.coles.com.au/browse'
const SPEED_LIMIT = 20

class ColesScraper implements Scraper {

  #rateLimit: RateLimiter

  constructor () {
    this.#rateLimit = new RateLimiter(SPEED_LIMIT, 5)
  }

  async scrapeAllCategories () {
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
    console.log(categories)

    const categoryPromises = categories.map(async (category) => {
      const products = await this.scrapeCategory(browser, category.url)
      return products
    })

    const productsByCategory = await Promise.all(categoryPromises)
    const products = productsByCategory.flat()

    await browser.close()
    return products
  }

  async scrapeCategory (browser: Browser, category_url: string) {
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
        const priceValue = await div.$('.price__value')
        const priceTxt = await priceValue?.getProperty('textContent')
        const price = await priceTxt?.jsonValue()
        
        const titleValue = await div.$('.product__title')
        const titleTxt = await titleValue?.getProperty('textContent')
        const title = await titleTxt?.jsonValue()

        const wasElement = await div.$('.price__was')
        const wasTxt = await wasElement?.getProperty('textContent')
        const was = await wasTxt?.jsonValue()

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
          discounted_from: wasNum,
          img_url: undefined
        }
      }))

      return products
    })

    return products
  }
}

export default ColesScraper