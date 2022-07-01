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
    port: +(process.env.API_REST_PORT || 3000),
  },
}
