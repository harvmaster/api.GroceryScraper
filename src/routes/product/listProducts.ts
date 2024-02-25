import { Request, Response } from "express";
import Products from '../../models/Product';

const listProducts = async (req: Request, res: Response) => {
  const products = await Products.find({});
  res.send(products);
}

export default listProducts;