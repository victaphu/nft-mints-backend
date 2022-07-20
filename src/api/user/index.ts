import {Request, Response, Router} from 'express'
import DbHelper from 'src/api/db-helper'
import {TokenController} from 'src/controller'
import {body} from 'express-validator'
import User from 'src/api/model/user'

// TODO: Safely close connection
const db = new DbHelper()

const createUser = async (req: Request, res: Response) => {
  const {phone} = req.body
  const user = new User(User.generateUUID(), phone)

  const conn = await db.connect()
  await conn.createUser(user)
  return res.json(user)
}

const getUser = async (req: Request, res: Response) => {
  const uuid = req.params.uuid

  const conn = await db.connect()
  return res.json(await conn.getUserByUUID(uuid))
}

const init = (app: Router) => {
  app.post('/', body('phone').isString().isLength({min: 10}), createUser)
  app.get('/:uuid', getUser)
}

export default init
