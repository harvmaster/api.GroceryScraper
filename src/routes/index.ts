import Express from 'express'

import product from './product'
import scrape from './scrape'

const router = Express.Router()

router.use('/products', product)
router.use('/scrape', scrape)

export default router