import Express from 'express';

// Get
import scrapeProvider from './scrapeProvider';

// Post
import addProduct from './addProduct';

const router = Express.Router();

// Get Request Handlers
// router.get('/:provider', scrapeProvider);

// Post Request Handlers
router.post('/product', addProduct)

export default router;