import puppeteer from 'puppeteer';
// import { Browser } from 'puppeteer';
import axios from 'axios'
import { Scraper } from '../Scraper';
import RateLimiter from '../../RateLimiter';

interface Product {
  name: string
  price: number
  discounted_from: number
  img_url: string
}

const WOOLWORTHS_API_ENDPOINT = 'https://www.woolworths.com.au/apis/ui/browse/category'
const CATEGORY_IDS = [
  '1_DEB537E' // Bakery
]

const WOOLWORTHS_URL = 'https://www.woolworths.com.au/shop/browse/bakery'
const SPEED_LIMIT = 20

export class WoolworthsScraper {
// export class WoolworthsScraper implements Scraper {

  #rateLimit: RateLimiter

  constructor () {
    this.#rateLimit = new RateLimiter(SPEED_LIMIT, 5)
  }

  // async scrapeAllCategories () {

  //   console.log('scraping')
  //   const res = await axios.post(WOOLWORTHS_API_ENDPOINT, {
  //     categoryId: CATEGORY_IDS[0],
  //     pageNumber: 1,
  //     pageSize: 24,
  //     sortType: "TraderRelevance",
  //     url: "/shop/browse/bakery",
  //     location: "/shop/browse/bakery",
  //     formatObject: "{\"name\":\"Bakery\"}",
  //     isSpecial: false,
  //     isBundle: false,
  //     isMobile: false,
  //     filters: [],
  //     token: "",
  //     gpBoost: 0,
  //     isHideUnavailableProducts: false,
  //     isRegisteredRewardCardPromotion: false,
  //     enableAdReRanking: false,
  //     groupEdmVariants: true,
  //     categoryVersion: "v2"
  //   })

  //   console.log(res.data)
  //   return res.data.Bundles.map(bundle => {
  //     const product = bundle.Products[0]
  //     return {
  //       name: product.DisplayName,
  //       price: product.Price,
  //       discounted_from: product.WasPrice,
  //       image_url: product.DetailsImagePaths[0]
  //     }
  //   })
  // }

  async scrapeAllCategories () {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto(WOOLWORTHS_URL)

    // await page.setRequestInterception(true);
    // page.on('request', (req) => {
    //   if (req.resourceType() === 'image' || req.resourceType() === 'script') return req.abort();
    //   return req.continue();
    // });

    const content = await page.content()
    console.log(content)

    const productTiles = await page.$$('.product-grid-v2--tile')
    console.log(productTiles)
    const products = await Promise.all(productTiles.map(async (tile) => {
      const nameContainer = await tile.$('.product-title-container')
      const name = await nameContainer.$('a').then(el => el?.jsonValue())

      const priceContainer = await tile.$('.product-tile-price')
      const price = await priceContainer.$('.primary').then(el => el?.jsonValue())

      const discounted_from = await tile.$eval('.was-price', el => el.textContent)
      const img_url = await tile.$eval('.product-image', el => el.getAttribute('src'))

      return {
        name,
        price,
        discounted_from,
        img_url
      }
    }))
    console.log(products)

    await browser.close()
    return products
  }

  // async scrapeCategory (browser: Browser, category_url: string) {

  // }

  // async scrapeURL (browser: Browser, url: string): Promise<Product[]> {

  // }

  // async scrapeAllCategories () {
  //   const browser = await puppeteer.launch()
  //   const page = await browser.newPage()
  //   await page.goto(WOOLWORTHS_URL)

  //   const categoryCardElements = await page.$$('[data-testid="category-card"]')
  //   const categoriesUnfiltered = await Promise.all(categoryCardElements.map(async (el) => {
  //     const href = await el?.getProperty('href')
  //     const url = await href?.jsonValue() as string
  //     const category = await el?.getProperty('textContent').then(txt => txt.jsonValue())
  //     return { name: category, url }
  //   }))

  //   const categories = categoriesUnfiltered.filter((cat) => cat.url !== null && cat.name !== 'Specials')
  //   console.log(categories)

  //   const categoryPromises = categories.map(async (category) => {
  //     const products = await this.scrapeCategory(browser, category.url)
  //     return products
  //   })

  //   const productsByCategory = await Promise.all(categoryPromises)
  //   const products = productsByCategory.flat()

  //   await browser.close()
  //   return products
  // }

  // async scrapeCategory (browser: Browser, category_url: string) {
  //   // const browser = await puppeteer.launch()
  //   const page = await browser.newPage()
  //   await page.goto(category_url)

  //   const paginationElement = await page.$('[data-testid="pagination"]')
  //   const ulElement = await paginationElement?.$('ul')
    
  //   const maxPages = 3
  //   // const maxPages = await ulElement?.evaluate((el) => {
  //   //   const childCount = el.childElementCount
  //   //   const lastPage = el.children[childCount-2]
  //   //   const lastPageNum = lastPage?.textContent
  //   //   return parseInt(lastPageNum)
  //   // })

  //   const pagePromises: Promise<Product[]>[] = []
  //   pagePromises.push(this.scrapeURL(browser, category_url))
  //   for (let i = 2; i <= maxPages; i++) {
  //     const pageURL = `${category_url}?page=${i}`
  //     pagePromises.push(this.scrapeURL(browser, pageURL))
  //   }

  //   const productByPage = await Promise.all(pagePromises)
  //   const products = productByPage.flat()

  //   return products
  // }

  // async scrapeURL (browser: Browser, url: string): Promise<Product[]> {
  //   const products = await this.#rateLimit.add<Product[]>(async () => {
  //     console.log('Scraping', url)
  //     const page = await browser.newPage()

  //     await page.setRequestInterception(true);
  //     page.on('request', (req) => {
  //       if (req.resourceType() === 'image' || req.resourceType() === 'script') return req.abort();
  //       return req.continue();
  //     });
      
  //     await page.goto(url)
  //     const el = await page.$$('[data-testid="product-tile"]')
  //     const products = await Promise.all(el.map(async (div) => {
  //       const priceValue = await div.$('.price__value')
  //       const priceTxt = await priceValue?.getProperty('textContent')
  //       const price = await priceTxt?.jsonValue()
        
  //       const titleValue = await div.$('.product__title')
  //       const titleTxt = await titleValue?.getProperty('textContent')
  //       const title = await titleTxt?.jsonValue()

  //       const wasElement = await div.$('.price__was')
  //       const wasTxt = await wasElement?.getProperty('textContent')
  //       const was = await wasTxt?.jsonValue()

  //       // Replace every non-digit character with an empty string
  //       const priceDigits = price?.replace(/\D/g, '') || '0'
  //       const priceNum = (parseFloat(priceDigits)/100)
  //       const priceNumFixed = priceNum?.toFixed(2)

  //       // Replace every non-digit character with an empty string
  //       const wasDigits = was?.replace(/\D/g, '') || '0'
  //       const wasNum = (parseFloat(wasDigits)/100)
  //       const wasNumFixed = wasNum?.toFixed(2)

  //       return {
  //         name: title,
  //         price: priceNum,
  //         discounted_from: wasNum,
  //         img_url: undefined
  //       }
  //     }))

  //     return products
  //   })

  //   return products
  // }
}