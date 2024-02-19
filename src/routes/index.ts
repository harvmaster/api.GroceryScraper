import Express from 'express'

import product from './product'

const router = Express.Router()

router.use('/product', product)

export default router