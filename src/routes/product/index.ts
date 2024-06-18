import Express from 'express';

import searchProduct from './searchProducts';
import listProducts from './listProducts';
import purgeProducts from './purgeProducts';
import getProduct from './getProduct';

const router = Express.Router();

router.get('/search', searchProduct);
router.get('/all', listProducts)
router.get('/purge', purgeProducts)

router.get('/:id', getProduct)

export default router;