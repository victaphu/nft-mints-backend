import express, {Router} from 'express'
import session from 'express-session'
import helmet from 'helmet'
import cors from 'cors'
import {logger} from 'src/logger'
import http, {Server} from 'http'
import {config} from 'src/config'
import cookieParser from 'cookie-parser'
import payment from './payment'
import sms from './smsgateway'
import token from './token'
import collection from './collection'
import user from './user'
import login from './user/login'
import mint from './minter'
import stripe from './stripe'
import MongoStore from 'connect-mongo'
// const MongoStore = require('connect-mongo');

import bodyParser from 'body-parser'
const l = logger(module)

declare module 'express-session' {
  export interface SessionData {
    state: string // { [key: string]: any };
    userUuid: string
    userWallet: string
  }
}

const whitelist = config.api.whitelistcors.split(';;')

// https://github.com/expressjs/session/issues/725
function when(test: any, a: any, b: any) {
  return (req: any, res: any, next: any) => (test(req, res) ? a : b)(req, res, next)
}

export const RESTServer = async () => {
  const api = express()

  api.use(helmet())
  api.disable('x-powered-by')
  // todo: fix origin
  api.use(
    cors({
      origin: (origin, callback) => {
        if (origin === undefined || whitelist.indexOf(origin!) !== -1) {
          callback(null, true)
        } else {
          console.log('failed', origin)
          callback(new Error('Not allowed by CORS ' + origin))
        }
      },
      credentials: true,
    })
  )
  api.use(cookieParser())
  api.use(
    when(
      (req: any) => req.headers['x-forwarded-proto'] === 'https' || req.protocol === 'https',
      session({
        name: 'dj3n session',
        resave: false,
        saveUninitialized: false,
        secret: config.api.sessionsecret,
        cookie: {
          secure: true,
          httpOnly: true,
          sameSite: 'none',
          maxAge: 1000 * 60 * 24, // 24 hours
        },
        store: MongoStore.create({
          mongoUrl: config.mongo.mongoUri,
          dbName: config.mongo.mongoDb,
        }),
      }),
      session({
        secret: config.api.sessionsecret,
        cookie: {
          secure: false,
          httpOnly: false,
        },
        store: MongoStore.create({
          mongoUrl: config.mongo.mongoUri,
          dbName: config.mongo.mongoDb,
        }),
      })
    )
  )
  // api.use(compression)
  api.use((req, res, next) => {
    if (req.originalUrl === '/v0/payment/hook') {
      next()
    } else {
      express.json()(req, res, next)
    }
  })

  api.enable('trust proxy')

  api.use(bodyParser.urlencoded({extended: false}))
  // api.use(bodyParser.json()) // need this comment out so our stripe integration will work

  const minterRouter = Router({mergeParams: true})
  const paymentRouter = Router({mergeParams: true})
  const smsRouter = Router({mergeParams: true})
  const tokensRouter = Router({mergeParams: true})
  const collectionsRouter = Router({mergeParams: true})
  const collectionsRouterv1 = Router({mergeParams: true})
  const usersRouter = Router({mergeParams: true})
  const userLogin = Router({mergeParams: true})
  const stripeConnect = Router({mergeParams: true})

  api.use('/v1/payment', paymentRouter)
  api.use('/v0/minter', minterRouter)
  api.use('/v0/sms', smsRouter)
  api.use('/v0/tokens', tokensRouter)
  api.use('/v0/collections', collectionsRouter)
  api.use('/v1/collections', collectionsRouterv1)
  api.use('/v0/users', usersRouter)
  api.use('/v1/login', userLogin)
  api.use('/v0/stripe', stripeConnect)

  let server: Server

  const close = () => server.close()

  mint(minterRouter)
  payment(paymentRouter)
  sms(smsRouter)
  token(tokensRouter)
  collection(collectionsRouter)
  collection(collectionsRouterv1, 1)
  user(usersRouter)
  login(userLogin)
  stripe(stripeConnect)

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
