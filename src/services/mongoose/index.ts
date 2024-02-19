'use strict'

import mongoose from 'mongoose'

mongoose.connection.on('connected', () => {
  console.log('MongoDB is connected')
})

mongoose.connection.on('error', (err) => {
  console.log(`Could not connect to MongoDB because of ${err}`)
  process.exit(1)
})

mongoose.set('debug', false)

const connect = async (url: string) => {
  const connection = mongoose.connect(url)
  return connection
}

export default { connect }
