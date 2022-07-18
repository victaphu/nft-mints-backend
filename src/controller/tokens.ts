import DbHelper from 'src/api/db-helper'
import Collection from 'src/api/model/collection'
import Token from 'src/api/model/token'
import Wallet from 'src/api/wallet'
import dataObj from 'src/store/mock'
import {StripeController} from '.'

export async function fetchTokenByAddress(tokenAddress: string) {
  return dataObj.collections.find((nft) => nft.nftAddress === tokenAddress)
}

export async function fetchTokens() {
  console.log(dataObj)
  return dataObj
}

export async function createToken(contractAddress: string, sequence: bigint, ownerUUID: string) {
  const token = new Token(contractAddress, sequence, ownerUUID, false)
  const db = new DbHelper()
  const conn = await db.connect()
  await db.createToken(token)
  await conn.close()

  return token
}

export async function mintToken(
  destination: string,
  verificationCode: string,
  collectionUuid: string
) {
  const wallet = new Wallet(process.env.RPC, process.env.PRIVATE_KEY)
  const db = new DbHelper()
  const conn = await db.connect()
  const token = await db.getToken(collectionUuid)
  await conn.close()

  if (!token) {
    throw new Error('Token not found, cannot mint')
  }

  await wallet.transferToken(token, destination, verificationCode)
}

export async function createCollection(
  title: string | 'Anonymous Collection',
  description: string | '',
  link: string | '',
  rate: number | 0,
  maxMint: number | 1
) {
  console.log(arguments)
  const c = new Collection(
    title || 'Anonymous Collection',
    description || '',
    link || '',
    rate || 0,
    maxMint || 1
  )

  const product = await StripeController.registerProduct(
    title || 'Anonymous Collection',
    description || 'Anonymous Collection',
    rate,
    c.addUUIDStamp(),
    link
  )

  c.productId = product.id
  // @ts-ignore ignoring since price should be returned as a price object with specific id
  c.priceId = product.default_price?.id

  const db = new DbHelper()
  const con = await db.connect()
  await con.createCollection(c)
  await db.close()

  return c
}

export async function getCollectionByUUID(uuid: string) {
  console.log('Get collection', uuid)
  const db = new DbHelper()

  const con = await db.connect()
  return await con.getCollectionByUUID(uuid)
}
