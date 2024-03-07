import { Request, Response } from 'express';
import Product from '../../models/Product';

export const purgeProducts = async (req: Request, res: Response) => {
  // try {
  //   await Product.deleteMany({});
  //   res.status(200).send('Products purged');
  // } catch (e) {
  //   res.status(500).send('Failed to purge products');
  // }
  try {
    await Product.deleteMany({ img_url: '' });
    res.status(200).send('Products purged');
  } catch (e) {
    res.status(500).send('Failed to purge products');
  }
}

export default purgeProducts