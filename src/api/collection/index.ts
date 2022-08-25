import {Request, Response, Router} from 'express'
import _ from 'lodash'
import DbHelper from 'src/api/db-helper'
import {TokenController} from 'src/controller'
import {body} from 'express-validator'
import {errorToObject} from '../transport'
import {TokenType} from 'src/types/tokens'
import Collection from 'src/api/model/collection'

// TODO: Safely close connection
const db = new DbHelper()

const createCollection = async (req: Request, res: Response) => {
  // TODO: should we have the user here? mobile number + sms code?
  const {title, description, link, rate, maxMint, collectionImage, tokenType} = req.body

  // v1 properties
  const {perks, creatorRoyalty, additionalDetails, properties, collectionImages} = req.body

  const ownerUUID = req.session.userUuid

  if (!ownerUUID) {
    // todo: refactor protected path using express-session
    return res.status(403).send({message: 'Login as creator first'})
  }

  try {
    res.json(
      await (
        await TokenController.createCollection({
          title,
          description,
          link,
          rate,
          maxMint,
          ownerUUID: ownerUUID,
          collectionImage,
          collectionImages,
          tokenType: +tokenType,
          perks,
          creatorRoyalty,
          additionalDetails,
          properties,
        })
      ).serialize()
    )
  } catch (err) {
    console.log(err)
    res.status(400).send(errorToObject(err))
  }
}

const getCollection = async (req: Request, res: Response) => {
  const uuid = req.params.uuid

  return res.json(await (await TokenController.getCollectionByUUID(uuid))?.serialize())
}

const getCollectionsByUser = async (req: Request, res: Response) => {
  try {
    const uuid = req.params.userUuid
    return res.json(Collection.serializeAll(await TokenController.getCollectionByUser(uuid)))
  } catch (e) {
    return res.status(400).send(errorToObject(e))
  }
}

const getUserDetailsWithCollections = async (req: Request, res: Response) => {
  // fetch your collections (by your uuid)
  // if no uuid we will throw exception
  if (!req.session.userUuid) {
    return res.status(400).send({message: 'Login as creator first'})
  }
  const data = await TokenController.getUserDetailsWithCollections(req.session.userUuid!)
  // TODO: Performance issue, do this with database instead add type as index
  data.collections = data.collections?.filter((e) => e.tokenType) || []
  return res.json(data.collections)
}

const getCollections = async (req: Request, res: Response) => {
  const {type, uuid} = req.params
  if (type && uuid && !isNaN(+type)) {
    // type must be number if it is defined and must be a token type
    return res.json(
      await Collection.serializeAll(await TokenController.getCollectionByUserAndType(uuid, +type))
    )
  }
  if (uuid) {
    return res.json(await Collection.serializeAll(await TokenController.getCollectionByUser(uuid)))
  }
  return res.json(await Collection.serializeAll(await TokenController.getCollections()))
}

const init = (app: Router, version: number = 0) => {
  app.get('/all', getCollections)
  app.get('/all/:uuid/:type', getCollections)
  app.get('/mycollections', getUserDetailsWithCollections)
  app.get('/:uuid', getCollection)
  app.get('/user/:userUuid', body('userUuid').isUUID(), getCollectionsByUser)

  if (version === 0) {
    app.post(
      '/create',
      body('title').isString().isLength({min: 1}),
      body('description').isString().default(''),
      body('link').isURL(),
      body('rate').isNumeric().default(0),
      body('maxMint').isNumeric().default(1),
      body('owner').isString().isLength({min: 1}),
      body('tokenType').isNumeric().isIn([1, 2, 3]),
      createCollection
    )
  }
  if (version === 1) {
    //
    app.post(
      '/create',
      body('title').isString().isLength({min: 1}),
      body('description').isString().default(''),
      body('link').isURL(),
      body('rate').isNumeric().default(0),
      body('maxMint').isNumeric().default(1),
      body('owner').isString().isLength({min: 1}),
      body('tokenType').isNumeric().isIn([1, 2, 3]),
      body('perk').isString().isLength({min: 1}),
      body('creatorRoyalty').isNumeric(),
      body('additionalDetails'),
      createCollection
    )
  }
}

export default init
