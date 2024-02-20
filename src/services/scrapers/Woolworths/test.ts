import { WoolworthsScraper } from ".";

const run = async () => {
  const scraper = new WoolworthsScraper();
  const products = await scraper.scrapeAllCategories();
  console.log(products)
}

run()