import {Request, Response, Router} from 'express'
import DbHelper from 'src/api/db-helper'
import {TokenController} from 'src/controller'
import {body} from 'express-validator'

// TODO: Safely close connection
const db = new DbHelper()

const createCollection = async (req: Request, res: Response) => {
  // TODO: should we have the user here? mobile number + sms code?
  const {title, description, link, rate, maxMint, collectionImage} = req.body
  // Refactor: "owner" will likely come from session after authentication is in place

  const ownerUUID = req.body.owner
  res.json(
    await TokenController.createCollection(
      title,
      description,
      link,
      rate,
      maxMint,
      ownerUUID,
      collectionImage
    )
  )
}

const getCollection = async (req: Request, res: Response) => {
  const uuid = req.params.uuid

  return res.json(await TokenController.getCollectionByUUID(uuid))
}

const getCollectionsByUser = async (req: Request, res: Response) => {
  const uuid = req.params.userUuid
  return res.json(await TokenController.getCollectionByUser(uuid))
}

const getCollections = async (req: Request, res: Response) => {
  return res.json(await TokenController.getCollections())
}

const init = (app: Router) => {
  app.get('/all', getCollections)
  app.get('/:uuid', getCollection)
  app.get('/user/:userUuid', body('userUuid').isUUID(), getCollectionsByUser)
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
