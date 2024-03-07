import { Request, Response } from "express";
import Product from '../../models/Test';
import { ProductProps } from '../../models/Test';
import ProductPriceEvent from "../../models/ProductPriceEvent";

type ProductWithPriceHistory = ProductProps & { price_history: any[] }

export const searchProduct = async (req: Request, res: Response) => {
  const query = req.query.q;

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

    const newProduct = new Product({
      retailer_product_id: 'test',
      retailer_name: 'test',
      name: 'test',
      tags: ['test']
    })

    const id = dbProducts[0].create_date
    const products = dbProducts.map((product) => product.toJSONData());

    const productIds = products.map((product) => product.id);
    const priceEvents = await ProductPriceEvent.find({ product: { $in: productIds } });

    // add prices array to each product
    const responseData = []
    products.forEach((product) => {
      const prd: any = product
      prd.price_history = priceEvents.filter((priceEvent) => priceEvent.product.toString() === product.id.toString());
      responseData.push(prd);
    });

    return res.status(200).send(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}

export default searchProduct;