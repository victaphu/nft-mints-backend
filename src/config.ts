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
  logger: {
    levels: {
      console: process.env.STDOUT_LOG_LEVELS
        ? (getCommaSeparatedList(process.env.STDOUT_LOG_LEVELS) as TLogLevel[])
        : (['error', 'info', 'warn', 'debug'] as TLogLevel[]),
    },
  },
  api: {
    port: +(process.env.PORT || 3000),
  },
  rpcUrl: process.env.RPC || '',
  web3: {
    privateKey: process.env.PRIVATE_KEY || '',
    factoryContractAddress:
      process.env.FACTORY_CONTRACT_ADDRESS || '0x29354b0c754563ff9a9263fddc390f8a1f7cf860',
  },
}
