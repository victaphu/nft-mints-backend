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
import Wallet from 'src/api/wallet'

const l = logger(module)

const doMint = async (req: Request, res: Response) => {
  let conn
  try {
    console.log('Doing minting now')
    // Refactor: "owner" will likely come from session after authentication is in place
    conn = await new DbHelper().connect()
    const owner = await conn.getUserByUUID(req.params.owner)
    const collection = await conn.getCollectionByUUID(req.params.collection)
    // Todo: handle null case
    const token = await mint(owner, collection!)
    res.status(200).json(token)
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
    const owner = await conn.getUserByUUID(req.params.owner)
    await initializeClaimCtl(owner)
    res.status(200).send()
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
    const owner = req.body.owner
    const {sequence, contract} = req.body
    const token = await conn.getToken({contractAddress: contract, sequence: sequence})

    await finalizeClaimCtl(owner, token, req.body.destination, req.body.smsCode)
    res.status(200).send()
  } catch (e) {
    console.error(e)
    res.status(500).json(e)
  } finally {
    conn?.close()
  }
}

const getSequenceIdFromMintID = async (req: Request, res: Response) => {
  const mintId = req.params.id
  const contract = req.params.contract
  const wallet = new Wallet()
  const sequence = await wallet.mintIdToTokenId(contract, mintId)

  res.json({contract, mintId, sequence})
}

const init = (app: Router, version: number = 0) => {
  l.info('Initialise minter endpoints')
  app.get('/chain-mint/:owner/:collection', doMint)
  app.get('/claim/init/:owner', initClaim)
  app.post('/claim/final/', finalizeClaim)
  app.get('/mint-id/:contract/:id', getSequenceIdFromMintID)

  app.get('/', (req, res) => {
    console.log('GET')
    res.json({message: 'Success'})
  })
}

export default init
