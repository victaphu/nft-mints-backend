import {Request, Response, Router} from 'express'

import Collection from 'src/api/model/collection'
import DbHelper from 'src/api/db-helper'
import {TokenController} from 'src/controller'

// TODO: Safely close connection
const db = new DbHelper()

const createCollection = async (req: Request, res: Response) => {
  // TODO: should we have the user here? mobile number + sms code?
  const {title, description, link, rate, maxMint} = req.body
  res.json(await TokenController.createCollection(title, description, link, rate, maxMint))
}

const getCollection = async (req: Request, res: Response) => {
  const uuid = req.params.userUuid

  return res.json(await TokenController.getCollectionByUUID(uuid))
}

const init = (app: Router) => {
  app.get('/:uuid', getCollection)
  app.post('/create', createCollection)
}

export default init
