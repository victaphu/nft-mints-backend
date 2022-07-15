import {Request, Response, Router} from 'express'

import express from 'express'
import {body, oneOf, validationResult} from 'express-validator'

import {logger} from 'src/logger'
import {TokenController} from 'src/controller'

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

const init = (app: Router) => {
  console.log('Initialise')
  app.post('/create', express.raw({type: 'application/json'}), createToken)
  app.get('/:tokenAddress/:tokenId?', express.raw({type: 'application/json'}), getToken)
  app.get('/', express.raw({type: 'application/json'}), getTokens)
}

export default init
