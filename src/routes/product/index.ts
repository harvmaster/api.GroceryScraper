import Express from 'express';

import searchProduct from './searchProducts';
import listProducts from './listProducts';

const router = Express.Router();

router.post('/search', searchProduct);
router.get('/all', listProducts)

export default router;