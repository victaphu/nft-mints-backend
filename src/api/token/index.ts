import {Request, Response, Router} from 'express'

import express from 'express'
import {body, oneOf, validationResult} from 'express-validator'

import {logger} from 'src/logger'
import {TokenController} from 'src/controller'
import Wallet from "src/api/wallet";
import DbHelper from "src/api/db-helper";

const l = logger(module)

const createToken = async (request: Request, response: Response) => {}

const getTokens = async (request: Request, response: Response) => {
  const {page = 0, limit = 10, filter} = request.body

  response.status(200).json(await TokenController.fetchTokens())
}

const getToken = async (request: Request, response: Response) => {
  const {tokenAddress, tokenId} = request.params

  // if (tokenId) {
  // }

  response.json(await TokenController.fetchTokenByAddress(tokenAddress))
}

// TODO: For testing only
const getWalletOwnerForNFT = async (req: Request, res: Response) => {
  try {
    const sequence = req.params.sequence

    const w = new Wallet()
    const db = new DbHelper()
    const conn = await db.connect()
    const token = await conn.getToken({
      contractAddress: '0x7f273afb22d33432e341de43484f9c7dac28bb5e',
      sequence: sequence.toString(),
    })
    return res.json({...token, sequence: sequence, ownerAddress: await w.lookupOwnerForNFT(token)})
  } catch (e) {
    console.error(e)
    return res.status(500)
  }
}

const init = (app: Router) => {
  console.log('Initialise')
  app.post('/create', express.raw({type: 'application/json'}), createToken)
  app.get('/owner/:sequence/', express.raw({type: 'application/json'}), getWalletOwnerForNFT)
  app.get('/:tokenAddress/:tokenId?', express.raw({type: 'application/json'}), getToken)
  app.get('/', express.raw({type: 'application/json'}), getTokens)
}

export default init
