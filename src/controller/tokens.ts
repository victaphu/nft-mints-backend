import DbHelper from 'src/api/db-helper'
import Collection from 'src/api/model/collection'
import Token from 'src/api/model/token'
import Wallet from 'src/api/wallet'
import dataObj from 'src/store/mock'
import {StripeController} from '.'

export async function fetchTokenByAddress(tokenAddress: string) {
  return dataObj.collections.find((nft) => nft.nftAddress === tokenAddress)
}

export async function fetchTokenByOwnerUuid(ownerUuid: string) {
  const db = new DbHelper()
  const con = await db.connect()
  const results = await Promise.all(
    (
      await con.getTokensByOwner(ownerUuid)
    ).map(async (token: Token) => {
      let collection = null
      if (token.collectionUUID && token.collectionUUID !== '') {
        collection = await db.getCollectionByUUID(token.collectionUUID)
      }

      return {
        token: token.toObject(),
        collection,
      }
    })
  )

  console.log(results)

  await con.close()

  return results
}

export async function fetchTokens() {
  console.log(dataObj)
  return dataObj
}

export async function createCollection(
  title: string | 'Anonymous Collection',
  description: string | '',
  link: string | '',
  rate: number | 0,
  maxMint: number | 1,
  ownerUUID: string,
  collectionImage: string | ''
) {
  if (+rate < 5) {
    throw new Error('Rate must be greater than $5')
  }
  console.log(arguments)
  const c = new Collection(
    ownerUUID,
    title || 'Anonymous Collection',
    description || '',
    link || '',
    rate || 0,
    maxMint || 1
  )
  c.collectionImage = collectionImage

  const tokenPrice = +rate * 100 // note: rate is in cents, so must multiply by 100 to get dollars

  const product = await StripeController.registerProduct(
    title || 'Anonymous Collection',
    description || 'Anonymous Collection',
    tokenPrice,
    c.addUUIDStamp(),
    collectionImage
  )

  c.productId = product.id
  // @ts-ignore ignoring since price should be returned as a price object with specific id
  c.priceId = product.default_price?.id

  const db = new DbHelper()
  const con = await db.connect()
  await con.createCollection(c)
  await con.close()

  return c
}

export async function getCollectionByUUID(uuid: string) {
  console.log('Get collection', uuid)
  const db = new DbHelper()

  const con = await db.connect()
  return await con.getCollectionByUUID(uuid)
}

export async function getCollectionById(id: string) {
  const db = new DbHelper()
  const con = await db.connect()
  try {
    return await con.getCollectionsByFilter({_id: id})
  } finally {
    con.close()
  }
}

export async function getCollectionByUser(userUuid: string) {
  console.log('Get collection', userUuid)
  const db = new DbHelper()

  const con = await db.connect()
  try {
    return await con.getCollectionsByFilter({userUuid})
  } finally {
    con.close()
  }
}

export async function getCollections() {
  const db = new DbHelper()

  const con = await db.connect()
  try {
    return await con.getCollectionsByFilter({})
  } finally {
    con.close()
  }
}
