import ColesScraper from "./Coles";

const run = async () => {
  const colesScraper = new ColesScraper();
  const products = await colesScraper.scrapeAllCategories();
  console.log(products)
}

run()