import Express from 'express';

import searchProduct from './searchProducts';

const router = Express.Router();

router.post('/search', searchProduct);

export default router;