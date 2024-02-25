import Express from 'express';

import scrapeProvider from './scrapeProvider';

const router = Express.Router();

router.get('/:provider', scrapeProvider);

export default router;