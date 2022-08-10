import {Request, Response, Router} from 'express'
import crypto from 'crypto'
import DbHelper from 'src/api/db-helper'
import {body} from 'express-validator'
import User from 'src/api/model/user'
import {errorToObject} from '../transport'
import {ethers} from 'ethers'
import {config} from 'src/config'

// TODO: Safely close connection
// todo: refactor this code to use controller
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

const logoutUser = async (req: Request, res: Response) => {
  req.session.destroy((err: any) => {
    if (!err) {
      res.json({message: 'logout successful'})
    } else {
      res.status(503).json(errorToObject(err))
    }
  })
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

const walletVerify = async (req: Request, res: Response) => {
  const {signature, messageHash, address, mobileNumber} = req.body
  if (!req.session.userUuid) {
    res.status(400).send({message: 'user not logged in'})
    return
  }

  const conn = await db.connect()
  try {
    const user = await conn.getUserByUUID(req.session.userUuid)

    // look up the message we wanted to sign
    // confirm that the message hash matches
    if (user.codeHash !== messageHash) {
      throw new Error('Failed - code hash does not match message hash')
    }
    if (!user.verify(user.pendingCode)) {
      throw new Error('Internal issue - hash not match pending code')
    }
    const recoveredAddress = ethers.utils.verifyMessage(user.pendingCode, signature)
    if (recoveredAddress !== address) {
      throw new Error('Internal issue - address signing hash not match reported address')
    }

    req.session.userUuid = user?.uuid // connect user
    req.session.userWallet = address
    return res.json(user)
  } catch (err) {
    console.log(err)
    res.status(400).send(errorToObject(err))
  } finally {
    conn.close()
  }
}

const walletSignRequest = async (req: Request, res: Response) => {
  if (!req.session.userUuid) {
    res.status(400).send({message: 'user not logged in'})
    return
  }

  const conn = await db.connect()
  try {
    const user = await conn.getUserByUUID(req.session.userUuid)
    // todo: hey edd this is where the signature happens; i need it to sign in this specific format
    // because sms wallet lookup function also takes a signature.
    // when this pops back i will have enough details to verify the signature of the user + their mobile
    user.pendingCode = `${user.phone} ${
      Math.floor(Date.now() / config.defaultSignatureValidDuration) *
      config.defaultSignatureValidDuration
    }`
    user.codeHash = crypto.createHash('sha256').update(user.pendingCode).digest('hex')
    await conn.updateUser(user)

    return res.json({message: user.pendingCode, phone: user.phone})
  } catch (err) {
    console.log(err)
    res.status(400).send(errorToObject(err))
  } finally {
    conn.close()
  }
}

const init = (app: Router, version = 0) => {
  app.post('/', body('phone').isString().isLength({min: 10}), createUser)
  app.post('/logout', logoutUser)
  app.get('/whoami', getUserBySession)
  app.get('/:uuid', getUser)
  app.get('/phone/:phone', getUserByPhone)

  if (version === 1) {
    app.get('/wallet-verify', body('signature'), body('messageHash'), body('address'), walletVerify)
    app.get('/wallet-sign-request', walletSignRequest)
  }
}

export default init
