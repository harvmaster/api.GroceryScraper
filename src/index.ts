import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { AddressInfo } from 'net'

import routes from './routes';

import mongoose from './services/mongoose'

import config from '../config'


let server;
export const startServer = async () => {
  
  // Connect to mongoDB
  try {
    console.log('Connecting to MongoDB')
    await mongoose.connect(config.mongoDB)
    console.log('Connected to MongoDB')
  } catch (err) {
    console.error(err.message)
  }

  //
  // Setup ExpressJS middleware, routes, etc
  //
  const app = express()
  app.use(cors())
  app.use(bodyParser.json())
  app.use(bodyParser.raw({ type: '*/*' }))
  app.use(function (err, req, res, next) {
    next()
  })
  app.use(routes)

  //
  // Set port and start ExpressJS Server
  //
  server = app.listen(config.port)
  const address = server.address() as AddressInfo
  console.log('Starting ExpressJS server')
  console.log(`ExpressJS listening at http://${address.address}:${address.port}`)
}

export const stopServer = async () => {
  server.close()
}