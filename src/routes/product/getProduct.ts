import { Request, Response } from "express";
import Product from '../../models/Product';

export const getProduct = async (req: Request, res: Response) => {
  const id = req.params.id;

  if (!id) {
    return res.status(400).send('No id provided');
  }

  try {
    const product = await Product.findOne({ barcode: id });

    if (!product) {
      return res.status(404).send('Product not found');
    }

    return res.status(200).send(product.toJSONData());
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}

export default getProduct;