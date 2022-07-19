import {Request, Response, Router} from 'express'

import express from 'express'
import {body, validationResult} from 'express-validator'
import {logger} from 'src/logger'
import DbHelper from 'src/api/db-helper'
import mint from 'src/controller/mint'
import {
  finalizeClaim as finalizeClaimCtl,
  initializeClaim as initializeClaimCtl,
} from 'src/controller/mint'
import Wallet from "src/api/wallet";

const l = logger(module)

const doMint = async (req: Request, res: Response) => {
  let conn
  try {
    // Refactor: "owner" will likely come from session after authentication is in place
    conn = await new DbHelper().connect()
    const owner = await conn.getUserByUUID(req.params.owner)
    const collection = await conn.getCollectionByUUID(req.params.collection)
    // Todo: handle null case
    await mint(owner, collection!)
    return res.status(200)
  } catch (e) {
    console.error(e)
    res.status(500).json(e)
  } finally {
    conn?.close()
  }
}

const initClaim = async (req: Request, res: Response) => {
  let conn
  try {
    conn = await new DbHelper().connect()

    // TODO
    // initializeClaimCtl(owner)
  } catch (e) {
    res.status(500).json(e)
  } finally {
    conn?.close()
  }
}

const finalizeClaim = async (req: Request, res: Response) => {
  let conn
  try {
    conn = await new DbHelper().connect()

    // TODO
    // finalizeClaimCtl(owner, token, req.body.destination, req.body.smsCode)
  } catch (e) {
    res.status(500).json(e)
  } finally {
    conn?.close()
  }
}

const getSequenceIdFromMintID = async function (req: Request, res: Response) {
  const mintId = req.params.id
  const contract = req.params.contract
  const wallet = new Wallet()
  const sequence = await wallet.mintIdToTokenId(contract, mintId)

  res.json({contract, mintId, sequence})
}

const init = (app: Router) => {
  l.info('Initialise minter endpoints')
  app.get('/chain-mint/:owner/:collection', doMint)
  app.post('/claim/init', initClaim)
  app.post('/claim/final/:token', finalizeClaim)
  app.get('/mint-id/:contract/:id', getSequenceIdFromMintID)

  app.get('/', (req, res) => {
    console.log('GET')
    res.json({message: 'Success'})
  })
}

export default init
