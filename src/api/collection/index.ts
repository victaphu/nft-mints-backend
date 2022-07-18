import {Request, Response, Router} from 'express'

import Collection from 'src/api/model/collection'
import DbHelper from 'src/api/db-helper'

// TODO: Safely close connection
const db = new DbHelper()

const createCollection = async (req: Request, res: Response) => {
  const c = new Collection(
    req.body.title || 'Anonymous Collection',
    req.body.description || '',
    req.body.link || '',
    req.body.rate || 0,
    req.body.maxMint || 1
  )
  const con = await db.connect()
  await con.createCollection(c)
  res.json(c)
}

const getCollection = async (req: Request, res: Response) => {
  const uuid = req.params.uuid
  const con = await db.connect()
  return res.json(await con.getCollectionByUUID(uuid))
}

const init = (app: Router) => {
  app.get('/:uuid', getCollection)
  app.post('/create', createCollection)
}

export default init
