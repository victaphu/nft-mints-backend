import {Request, Response, Router} from 'express'
import crypto from 'crypto'
import DbHelper from 'src/api/db-helper'
import {body} from 'express-validator'
import User from 'src/api/model/user'
import {errorToObject} from '../transport'

// TODO: Safely close connection
// todo: refactor this code to use controller
const db = new DbHelper()

// todo: only allow sms wallet to call this
// expected sms wallet to invoke this upon successful creation of the sms wallet!!!
const createUser = async (req: Request, res: Response) => {
  const {phone} = req.body
  const user = new User(User.generateUUID(), phone)
  const conn = await new DbHelper().connect()

  try {
    await conn.createUser(user)
    req.session.userUuid = user.uuid // set user uuid here for now?
    return res.json(user)
  } finally {
    conn.close()
  }
}

const updateUser = async (req: Request, res: Response) => {
  const {name, publicLink, profileImage, profileImageBg} = req.body
  if (!req.session.userUuid) {
    throw new Error('user not logged in')
  }

  const conn = await new DbHelper().connect()
  try {
    const user = await conn.getUserByUUID(req.session.userUuid)
    user.publicLink = publicLink
    user.profileImage = profileImage
    user.profileImageBg = profileImageBg
    user.name = name

    await conn.updateUser(user)

    return res.json(user)
  } catch (err) {
    console.log(err)
    res.status(400).send(errorToObject(err))
  } finally {
    conn.close()
  }
}

const getUser = async (req: Request, res: Response) => {
  const uuid = req.params.uuid

  const conn = await new DbHelper().connect()
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

  const conn = await new DbHelper().connect()
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

  const conn = await new DbHelper().connect()
  try {
    const user = await conn.getUserByPhone(phone)
    req.session.userUuid = user?.uuid // connect user
    return res.json(user)
  } catch (err) {
    console.log(err)
    res.status(400).send(errorToObject(err))
  } finally {
    conn.close()
  }
}

const init = (app: Router, version = 0) => {
  app.post('/', body('phone').isString().isLength({min: 10}), createUser)
  app.put('/', updateUser)
  app.get('/whoami', getUserBySession)
  app.get('/:uuid', getUser)
  app.get('/phone/:phone', getUserByPhone)
}

export default init
