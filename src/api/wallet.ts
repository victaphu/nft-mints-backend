import {BigNumber, ethers} from 'ethers'
// @ts-ignore
import {abi} from './abi/MinterNFTV0'
import {abi as NFTFactoryABI} from './abi/NFTFactory.json'
import {config} from '../config'

import User from './model/user'
import Token from './model/token'
import DbHelper from './db-helper'
import Collection from './model/collection'

export default class Wallet {
  private static PRIVATE_KEY_DEFAULT = config.web3.privateKey
  private static RPC_DEFAULT = config.rpcUrl
  private provider: ethers.providers.Provider
  private wallet: ethers.Signer

  constructor(_rpc = '', _privateKey = '') {
    const privateKey = _privateKey || Wallet.PRIVATE_KEY_DEFAULT
    const rpc = _rpc || Wallet.RPC_DEFAULT
    if (!privateKey) throw new Error('No private key specified')
    this.provider = ethers.getDefaultProvider(rpc)
    this.wallet = new ethers.Wallet(privateKey, this.provider)
  }

  getPublicKey(): Promise<string> {
    return this.wallet.getAddress()
  }

  async transferToken(token: Token, destination: string, verificationCode: string) {
    if (token.isClaimed) throw new Error('Token has already been claimed')

    const db = new DbHelper()
    const conn = await db.connect()
    const owner = await conn.getUserByUUID(token.ownerUUID)
    await conn.close()

    if (!owner || !owner.verify(verificationCode)) throw new Error('Invalid verification code')

    const contract = new ethers.Contract(token.contractAddress, abi, this.provider).connect(
      this.wallet
    )
    // TODO: Add safeTransferFrom to smart contract
    return contract['safeTransferFrom(address,address,uint256)'](
      this.wallet.getAddress(),
      destination,
      token.sequence
    )
  }

  async lookupOwnerForNFT(token: Token) {
    const contract = new ethers.Contract(token.contractAddress, abi, this.provider)
    return contract.callStatic.ownerOf(token.sequence)
  }

  async deployCollection(
    collection: Collection,
    symbol: string,
    ownerAddress: string
  ): Promise<string> {
    const {title, maxMint} = collection

    const contract = new ethers.Contract(
      config.web3.factoryContractAddress,
      NFTFactoryABI,
      this.wallet
    )

    const collectionAddress = await contract.callStatic.deployCollection(
      title,
      symbol,
      ownerAddress,
      maxMint
    )

    await contract.deployCollection(title, symbol, ownerAddress, maxMint)
    return collectionAddress
  }

  // TODO: Can remove, used for testing only
  async mintIdToTokenId(address: string, mintId: BigNumber | string) {
    const contract = new ethers.Contract(address, abi, this.provider)

    const sequence = await contract.callStatic.mintIdToTokenId(BigNumber.from(mintId))
    return sequence
  }

  async mint(owner: User, collection: Collection) {
    if (!owner.walletAddress || !ethers.utils.isAddress(owner.walletAddress)) {
      throw new Error('failed, owner wallet address is not valid')
    }
    let conn
    try {
      const db = new DbHelper()
      conn = await db.connect()
      const collectionDb = await conn.getCollectionByUUID(collection.uuid!)
      // Todo: handle null case for collection
      const token = new Token(
        collectionDb!.uuid || '',
        collectionDb!.collectionAddress,
        owner.uuid,
        false
      )

      token.addMintIdStamp()
      await conn.createToken(token)

      const contract = new ethers.Contract(token.contractAddress, abi, this.provider)
      const tx = await contract.connect(this.wallet).mint(owner.walletAddress, token.uniqueMintId)
      await tx.wait()

      const sequence = await contract.callStatic.mintIdToTokenId(BigNumber.from(token.uniqueMintId))
      token.sequence = sequence
      token.isClaimed = true // transferred to the owner if this succeeds
      await conn.updateToken(token)
      return token
    } finally {
      await conn?.close()
    }
  }
}
