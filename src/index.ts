import {logger} from './logger'
import {config} from 'src/config'
import {api} from 'src/api'

const l = logger(module)

const run = async () => {
  l.info('Started Harmony NFT Minter')
  await api()
}

run()
