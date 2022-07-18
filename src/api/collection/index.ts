import {Request, Response, Router} from 'express'

import Collection from 'src/api/model/collection'
import DbHelper from 'src/api/db-helper'
import {TokenController} from 'src/controller'
import {body} from 'express-validator'

// TODO: Safely close connection
const db = new DbHelper()

const createCollection = async (req: Request, res: Response) => {
  // TODO: should we have the user here? mobile number + sms code?
  const {title, description, link, rate, maxMint} = req.body
  res.json(await TokenController.createCollection(title, description, link, rate, maxMint))
}

const getCollection = async (req: Request, res: Response) => {
  const uuid = req.params.uuid

  return res.json(await TokenController.getCollectionByUUID(uuid))
}

const init = (app: Router) => {
  app.get('/:uuid', getCollection)
  app.post(
    '/create',
    body('title').isString().isLength({min: 1}),
    body('description').isString().default(''),
    body('link').isURL(),
    body('rate').isNumeric().default(0),
    body('maxMint').isNumeric().default(1),
    createCollection
  )
}

export default init
