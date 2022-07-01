import {RESTServer} from 'src/api/server'
import {logger} from 'src/logger'

const l = logger(module)

export const api = async () => {
  l.info('API Starting')
  await RESTServer()
}
