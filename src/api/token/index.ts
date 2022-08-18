import {Request, Response, Router} from 'express'

import express from 'express'
import {body, oneOf, validationResult} from 'express-validator'

import {logger} from 'src/logger'
import {TokenController} from 'src/controller'
import Wallet from 'src/api/wallet'
import DbHelper from 'src/api/db-helper'
import {config} from 'src/config'

const l = logger(module)

const createToken = async (request: Request, response: Response) => {}

const getTokens = async (request: Request, response: Response) => {
  const {page = 0, limit = 10, filter} = request.body

  response.status(200).json(await TokenController.fetchTokens())
}

const getTokensByOwner = async (request: Request, response: Response) => {
  const {ownerUuid} = request.params

  // if (tokenId) {
  // }

  response.json(await TokenController.fetchTokenByOwnerUuid(ownerUuid))
}

const getTokensByOwnerAndCreator = async (request: Request, response: Response) => {
  const {ownerUuid, creatorUuid, tokenType} = request.params

  const tokens = await TokenController.fetchTokenByOwnerUuid(ownerUuid)
  const filtered = tokens
    .filter((t) => t.collection)
    .filter((t) => t.collection?.ownerUUID === creatorUuid)

  if (tokenType && !isNaN(+tokenType)) {
    return response.json(filtered.filter((token) => token.collection?.tokenType === +tokenType))
  }

  return response.json(filtered)
}

const getTokenByUUID = async (request: Request, response: Response) => {
  const {tokenUuid} = request.params

  let conn
  try {
    const db = new DbHelper()
    conn = await db.connect()
    const token = await conn.getTokenByUUID(tokenUuid)

    response.json({
      token: token.toObject(),
      collection: token.collectionUUID && (await conn.getCollectionByUUID(token.collectionUUID)),
    })
  } catch (e) {
    console.error(e)
    response.status(500).send()
  } finally {
    conn?.close()
  }
}

// TODO: For testing only
const getWalletOwnerForNFT = async (req: Request, res: Response) => {
  let conn
  try {
    const sequence = req.params.sequence

    const w = new Wallet()
    const db = new DbHelper()
    conn = await db.connect()
    const token = await conn.getToken({
      contractAddress: '0x7f273afb22d33432e341de43484f9c7dac28bb5e',
      sequence: sequence.toString(),
    })
    return res.json({...token, sequence: sequence, ownerAddress: await w.lookupOwnerForNFT(token)})
  } catch (e) {
    console.error(e)
    return res.status(500)
  } finally {
    conn?.close()
  }
}

const getMetadata = async (req: Request, res: Response) => {
  let conn
  try {
    const tokenUUID = req.params.uuid

    const db = new DbHelper()
    conn = await db.connect()
    const token = await conn.getTokenByUUID(tokenUUID)
    const collection = await conn.getCollectionByUUID(token.collectionUUID)
    if (!collection) {
      throw new Error(`Invalid collection ${token.collectionUUID} for token ${token.uuid}`)
    }

    const meta = {
      name: collection.title,
      description: collection.description,
      external_url: `${config.api.frontendurl}/item/${token.uuid}`,
      image: collection.collectionImage,
      attributes: [],
    }
    res.json(meta)
  } catch (e) {
    console.error(e)
    res.status(500).send()
  } finally {
    conn?.close()
  }
}

const init = (app: Router) => {
  console.log('Initialise')
  app.post('/create', express.raw({type: 'application/json'}), createToken)
  app.get(
    '/token/:tokenUuid',
    express.raw({type: 'application/json'}),
    body('tokenUuid').isUUID(),
    getTokenByUUID
  )
  app.get('/owner/:sequence/', express.raw({type: 'application/json'}), getWalletOwnerForNFT)
  app.get('/meta/:uuid/', express.raw({type: 'application/json'}), getMetadata)

  // todo should getting tokens for a specific user be hidden? its blockchain data anyway so maybe no
  app.get(
    '/wallet/:ownerUuid/:creatorUuid/:tokenType',
    body('ownerUuid').isUUID(),
    body('creatorUuid').isUUID(),
    express.raw({type: 'application/json'}),
    getTokensByOwnerAndCreator
  )

  app.get('/:ownerUuid', express.raw({type: 'application/json'}), getTokensByOwner)
  app.get('/', express.raw({type: 'application/json'}), getTokens)
}

export default init
