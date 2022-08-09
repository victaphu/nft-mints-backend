import {Request, Response, Router} from 'express'
import DbHelper from 'src/api/db-helper'
import {TokenController} from 'src/controller'
import {body} from 'express-validator'
import User from 'src/api/model/user'
import {errorToObject} from '../transport'

// TODO: Safely close connection
const db = new DbHelper()

// todo: only allow sms wallet to call this
// expected sms wallet to invoke this upon successful creation of the sms wallet!!!
const createUser = async (req: Request, res: Response) => {
  const {phone} = req.body
  const user = new User(User.generateUUID(), phone)

  const conn = await db.connect()
  try {
    await conn.createUser(user)
    req.session.userUuid = user.uuid // set user uuid here for now?
    return res.json(user)
  } finally {
    conn.close()
  }
}

const getUser = async (req: Request, res: Response) => {
  const uuid = req.params.uuid

  const conn = await db.connect()
  try {
    req.session.userUuid = uuid // connect user
    return res.json(await conn.getUserByUUID(uuid))
  } catch (err) {
    console.log(err)
    res.status(400).send(errorToObject(err))
  } finally {
    conn.close()
  }
}

const getUserBySession = async (req: Request, res: Response) => {
  const uuid = req.session.userUuid!

  const conn = await db.connect()
  try {
    return res.json(await conn.getUserByUUID(uuid))
  } catch (err) {
    console.log(err)
    res.status(400).send(errorToObject(err))
  } finally {
    conn.close()
  }
}

const getUserByPhone = async (req: Request, res: Response) => {
  const phone = req.params.phone

  const conn = await db.connect()
  try {
    if (!req.session.counter) req.session.counter = 1
    else req.session.counter++

    const user = await conn.getUserByPhone(phone)
    console.log('Test', req.session.userUuid, req.session.counter)
    req.session.userUuid = user?.uuid // connect user
    console.log(req.session.userUuid, user?.uuid)

    return res.json(user)
  } catch (err) {
    console.log(err)
    res.status(400).send(errorToObject(err))
  } finally {
    conn.close()
  }
}

const init = (app: Router) => {
  app.post('/', body('phone').isString().isLength({min: 10}), createUser)
  app.get('/whoami', getUserBySession)
  app.get('/:uuid', getUser)
  app.get('/phone/:phone', getUserByPhone)
}

export default init
