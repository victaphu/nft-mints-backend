import {BigNumber, ethers} from 'ethers'
// @ts-ignore
import {abi} from './abi/MinterNFTV0'

import User from './model/user'
import Token from './model/token'
import DbHelper from './db-helper'
import Collection from './model/collection'

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

    // TODO: Add safeTransferFrom to smart contract
    return new ethers.Contract(token.contractAddress, abi, this.provider)
      .connect(this.wallet)['safeTransferFrom(address,address,uint256)'](
        this.wallet.getAddress(),
        destination,
        token.sequence
      )
  }

  async lookupOwnerForNFT(token: Token) {
    const contract = new ethers.Contract(token.contractAddress, abi, this.provider)
    return contract.callStatic.ownerOf(token.sequence)
  }

  // TODO: Can remove, used for testing only
  async mintIdToTokenId(address: string, mintId: BigNumber | string) {
    const contract = new ethers.Contract(address, abi, this.provider)

    console.log('Finding sequence ID')
    const sequence = await contract.callStatic.mintIdToTokenId(BigNumber.from(mintId))
    return sequence
  }

  async mint(owner: User, collection: Collection) {
    let conn
    try {
      const db = new DbHelper()
      conn = await db.connect()
      const collectionDb = await conn.getCollectionByUUID(collection.uuid!)
      // Todo: handle null case for collection
      const token = new Token(collectionDb!.collectionAddress, owner.uuid, false)

      token.addMintIdStamp()
      await conn.createToken(token)

      console.log('Minting transaction')
      const contract = new ethers.Contract(token.contractAddress, abi, this.provider)
      const tx = await contract
        .connect(this.wallet)
        .mint(this.wallet.getAddress(), token.uniqueMintId)
      await tx.wait()

      console.log('Finding sequence ID')
      const sequence = await contract.callStatic.mintIdToTokenId(BigNumber.from(token.uniqueMintId))
      token.sequence = sequence
      await conn.updateToken(token)
      return token
    } finally {
      await conn?.close()
    }
  }
}
