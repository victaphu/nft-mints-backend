import ethers from 'ethers'
// import {createRequire} from 'module'
// const _require = createRequire(import.meta.url)
const V0ERC721ABI = require('') // TODO

import User from './model/user'
import Token from './model/token'
import DbHelper from './db-helper'

export default class Wallet {
  private static PRIVATE_KEY_DEFAULT = process.env.PRIVATE_KEY || ''
  private static RPC_DEFAULT = process.env.RPC || ''
  private provider: ethers.providers.Provider
  private wallet: ethers.Signer

  constructor(_rpc = '', _privateKey = '') {
    const privateKey = _privateKey || Wallet.PRIVATE_KEY_DEFAULT
    const rpc = _rpc || Wallet.RPC_DEFAULT
    if (!privateKey) throw new Error('No private key specified')
    this.provider = ethers.getDefaultProvider(rpc)
    this.wallet = new ethers.Wallet(privateKey, this.provider)
  }

  async transferToken(token: Token, destination: string, verificationCode: string) {
    if (token.isClaimed) throw new Error('Token has already been claimed')

    const db = new DbHelper()
    const conn = await db.connect()
    const owner = await conn.getUserByUUID(token.ownerUUID)
    await conn.close()

    if (!owner || !owner.verify(verificationCode)) throw new Error('Invalid verification code')

    // TODO
    const contract = new ethers.Contract(token.contractAddress, V0ERC721ABI, this.provider)
  }

  async mint(owner: User) {
    // TODO
  }
}
