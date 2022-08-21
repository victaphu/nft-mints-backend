import {Request, Response, Router} from 'express'
import {config} from 'src/config'
import LoginController from 'src/controller/login-controller'
import {UserType} from 'src/types/users'
import Web3 from 'web3'
import DbHelper from '../db-helper'
import User from '../model/user'
import {errorToObject} from '../transport'

const getController = (user: User, conn: DbHelper) => {
  const store = async (msgHash: string, msg: string) => {
    console.log('messageHash', msgHash)
    user.codeHash = msgHash!
    user.pendingCode = msg
    await conn.updateUser(user)
  }

  return new LoginController({
    appName: 'DJ3N',
    store,
    lookup: async (k: string): Promise<string> => {
      const u = await conn.getUserByUUID(user.uuid)
      return u.pendingCode
    },
    remove: async (k: string): Promise<string> => {
      const code = user.pendingCode
      user.pendingCode = ''
      user.codeHash = ''
      await conn.updateUser(user)

      return user.pendingCode
    },
    generate: async (): Promise<string> => {
      const otc = LoginController.generateOneTimeCode()
      const msg = `${user.phone} ${
        Math.floor(Date.now() / config.defaultSignatureValidDuration) *
        config.defaultSignatureValidDuration
      }`
      // web3 accounts that SMS wallet uses envelopes the message. We'll need to modify it to match.
      const envelopeMsg = '\x19Ethereum Signed Message:\n' + msg.length + msg
      const msgHash = Web3.utils.soliditySha3(envelopeMsg)
      await store(msgHash!, msg)
      return msg
    },
  })
}

const walletVerify = async (req: Request, res: Response) => {
  const {signature, messageHash, address, error, cancelled, phone, userType} = req.body

  const conn = await new DbHelper().connect()
  try {
    const user = await conn.getUserByPhone(phone)
    if (!user) {
      throw new Error(`user not found with phone ${phone}`)
    }
    const controller = getController(user, conn)

    console.log(messageHash, user.codeHash)
    // look up the message we wanted to sign
    // confirm that the message hash matches
    if (user.codeHash !== messageHash) {
      throw new Error('Failed - code hash does not match message hash')
    }
    const verified = await controller.verifyLogin({
      signature,
      messageHash,
      address,
      error,
      cancelled,
    })
    if (!verified) {
      throw new Error('Signature does not match')
    }

    console.log('wallet verify success', address, user.walletAddress)

    req.session.userUuid = user?.uuid // connect user
    req.session.userWallet = address

    user.walletAddress = address
    user.userType = userType || UserType.USER
    await conn.updateUser(user)

    return res.json(user)
  } catch (err) {
    console.log(err)
    res.status(400).send(errorToObject(err))
  } finally {
    conn.close()
  }
}

// unpriviledged path
const walletSignRequest = async (req: Request, res: Response) => {
  const callbackUrl = config.api.callbackVerify
  const redirectPostLogin = req.body.redirect
  const phone = req.body.phone

  // todo: if the user is logged in and already has an account; we should
  // reject this request? or should we update the users' wallet address?

  const conn = await new DbHelper().connect()
  try {
    let user = await conn.getUserByPhone(phone)
    if (!user) {
      user = new User(User.generateUUID(), phone)
      await conn.createUser(user)
      user = await conn.getUserByUUID(user.uuid)
    }
    const controller = getController(user, conn)
    const result = await controller.initLogin({
      callbackUrl: redirectPostLogin || callbackUrl,
    })

    return res.json(result)
  } catch (err) {
    console.log(err)
    res.status(400).send(errorToObject(err))
  } finally {
    conn.close()
  }
}

const logoutUser = async (req: Request, res: Response) => {
  console.log('logout user')
  req.session.destroy((err: any) => {
    if (!err) {
      res.json({message: 'logout successful'})
    } else {
      res.status(503).json(errorToObject(err))
    }
  })
}

const getUserBySession = async (req: Request, res: Response) => {
  const address = req.session.userWallet
  const userUuid = req.session.userUuid
  res.json({
    isAuthenticated: !!address && !!userUuid,
    address: address,
    userUuid,
  })
}

const init = (app: Router) => {
  app.get('/logout', logoutUser)
  app.get('/whoami', getUserBySession)
  app.post('/init', walletSignRequest)
  app.post('/verify', walletVerify)
}

export default init
