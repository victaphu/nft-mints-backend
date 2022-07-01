import express, {Router} from 'express'
import helmet from 'helmet'
import compression from 'compression'
import cors from 'cors'
import {logger} from 'src/logger'
import http, {Server} from 'http'
import {config} from 'src/config'

const l = logger(module)

export const RESTServer = async () => {
  const api = express()
  api.use(helmet())
  api.disable('x-powered-by')
  api.use(cors)
  api.use(compression)

  const minterRouter = Router({mergeParams: true})
  const paymentRouter = Router({mergeParams: true})

  api.use('/v0/payment', paymentRouter)
  api.use('/v0/minter', minterRouter)
  let server: Server

  const close = () => server.close()

  l.info('REST API starting...')
  try {
    server = http.createServer(api).listen(config.api.port, () => {
      l.info(`REST API listening at http://localhost:${config.api.port}`)
    })
  } catch (error) {
    l.error('Error when starting up API', {error})
  }

  return close
}
