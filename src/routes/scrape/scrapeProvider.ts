import { Request, Response } from 'express';
import Coles from '../../services/scrapers/Coles';
import Woolworths from '../../services/scrapers/Woolworths';
import { scrape } from '../../services/scrapers/scrape';

const scrapeProvider = async (req: Request, res: Response) => {
  const { provider } = req.params;
  let scraper;
  
  switch (provider) {
    case 'coles':
      scraper = new Coles();
      break;
    case 'woolworths':
      scraper = new Woolworths();
      break;
    default:
      return res.status(400).send('Invalid provider');
  }

  const products = await scrape(scraper);
  res.send(products);
}

export default scrapeProvider;