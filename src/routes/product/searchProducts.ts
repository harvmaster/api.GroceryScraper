import { Request, Response, response } from "express";
import Product from '../../models/Product';
import ProductPriceEvent from "../../models/ProductPriceEvent";

export const searchProduct = async (req: Request, res: Response) => {
  const query = req.query.q;
  const getPriceEvents = req.query.priceEvents === 'true';

  if (!query) {
    return res.status(400).send('No query provided');
  }

  try {
    // Search by name and tags
    const dbProducts = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } }, // Case-insensitive regex search on name
        { tags: { $regex: query, $options: 'i' } }  // Case-insensitive regex search on tags
      ]
    });

    const products = dbProducts.map((product) => product.toJSONData());

    if (getPriceEvents) {
      const productIds = products.map((product) => product.id);
      const priceEvents = await ProductPriceEvent.find({ product: { $in: productIds } });
      console.log(priceEvents)
      // add prices array to each product

      const responseData = []
      products.forEach((product) => {
        const prd: any = product
        prd.prices = priceEvents.filter((priceEvent) => priceEvent.product.toString() === product.id.toString());
        // console.log(prd)
        console.log(prd.prices)
        responseData.push(prd);
      });
      // console.log(responseData)
      return res.status(200).send(responseData);
    }

    const priceEvents = await ProductPriceEvent.find({})


    res.status(200).send({ products, priceEvents });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}

export default searchProduct;