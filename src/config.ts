import * as dotenv from 'dotenv'
import {TLogLevel} from 'zerg/dist/types'

dotenv.config()

const getCommaSeparatedList = (list: string | undefined): string[] =>
  (list || '')
    .split(' ')
    .filter((a) => a)
    .join('')
    .split(',')

export const config = {
  api: {
    frontendurl: process.env.FRONTEND_URI!,
    port: +(process.env.PORT || 3000),
    serverendpoint: process.env.SERVER_ENDPOINT_API!,
    sessionsecret: process.env.SESSION_SECRET!,
    whitelistcors: process.env.WHITELIST_CORS!,
  },
  defaultSignatureValidDuration: 1000 * 60 * 15, // used to sign request
  logger: {
    levels: {
      console: process.env.STDOUT_LOG_LEVELS
        ? (getCommaSeparatedList(process.env.STDOUT_LOG_LEVELS) as TLogLevel[])
        : (['error', 'info', 'warn', 'debug'] as TLogLevel[]),
    },
  },
  mongo: {
    mongoDb: process.env.MONGO_DATABASE!,
    mongoUri: process.env.MONGO_URI!,
  },
  sms: {
    accountId: process.env.TWILIO_ACCOUNT_ID!,
    authToken: process.env.TWILIO_AUTH_TOKEN!,
    fromPhone: process.env.TWILIO_FROM_PHONE!,
  },
  rpcUrl: process.env.RPC || '',
  stripe: {
    stripeApiKey: process.env.STRIPE_API_KEY!,
    stripeAuthFail: process.env.STRIPE_AUTH_FAILURE!,
    stripeClientId: process.env.STRIPE_CLIENT_ID!,
    stripeAuthSuccess: process.env.STRIPE_AUTH_SUCCESS!,
    stripeAuthUrl: process.env.STRIPE_AUTH_URL!,
    stripeEndpointSecret: process.env.STRIPE_ENDPOINT_SECRET!,
  },
  web3: {
    factoryContractAddress:
      process.env.FACTORY_CONTRACT_ADDRESS || '0x29354b0c754563ff9a9263fddc390f8a1f7cf860',
    privateKey: process.env.PRIVATE_KEY || '',
  },
}
