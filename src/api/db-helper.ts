import {MongoClient, ServerApiVersion, Db} from 'mongodb'
import User from './model/user'
import Token from './model/token'
import Collection from "src/api/model/collection";

export default class DbHelper {
  private client: MongoClient | undefined
  private db: Db | undefined
  static URI: string = process.env.MONGO_URI || ''
  static DB_NAME: string = process.env.MONGO_DATABASE || ''

  constructor() {
    if (!DbHelper.URI) {
      throw new DbError(
        DbError.Type.MISSING_REQUIRED_ENV_VAR,
        'MONGO_URI is not defined. Check your .env file.'
      )
    }
    if (!DbHelper.DB_NAME) {
      throw new DbError(
        DbError.Type.MISSING_REQUIRED_ENV_VAR,
        'MONGO_DATABASE is not defined. Check your .env file.'
      )
    }
  }

  initCollections() {
    this._initUsersCollection()
  }

  private _initUsersCollection() {
    const collection = 'users'
    this.db?.collection(collection)
  }

  async connect() {
    this.client = new MongoClient(DbHelper.URI, {
      serverApi: ServerApiVersion.v1,
    })
    await this.client.connect()
    this.db = this.client.db(DbHelper.DB_NAME)
    return this
  }

  async close() {
    if (!this.client) {
      throw new DbError(DbError.Type.UNINITIALIZED, 'Cannot close uninitialized connection')
    }
    return await this.client.close()
  }

  async createUser(user: User) {
    const collection = 'users'
    const existingUser = await this.getUserByPhone(user.phone)
    if (existingUser) {
      throw new DbError(DbError.Type.ALREADY_EXISTS, 'user already exists')
    }
    const objToAdd = {...user, dateCreated: new Date().toISOString()}
    return this.db?.collection(collection).insertOne(objToAdd)
  }

  async updateUser(user: User) {
    const collection = 'users'
    const existingUser = await this.getUserByPhone(user.phone)
    if (!existingUser) {
      throw new DbError(DbError.Type.UNINITIALIZED, 'user does not exist')
    }
    return this.db
      ?.collection(collection)
      .findOneAndUpdate({uuid: user.uuid}, {$set: {...user}}, {upsert: true})
  }

  async getUserByPhone(phone: string) {
    const collection = 'users'
    const result = await this.db?.collection(collection).findOne({phone: phone})
    if (!result) return null
    return User.fromDatabase(result)
  }

  async getUserByUUID(uuid: string): Promise<User> {
    const collection = 'users'
    const result = await this.db?.collection(collection).findOne({uuid: uuid})
    if (!result) {
      throw new DbError(DbError.Type.UNINITIALIZED, `Specified user UUID ${uuid} does not exist`)
    }
    return User.fromDatabase(result)
  }

  async getToken(filter: any): Promise<Token> {
    const collection = 'tokens'
    const result = await this.db?.collection(collection).findOne(filter)
    if (!result) {
      throw new DbError(DbError.Type.UNINITIALIZED, `Specified token filter found no match`)
    }
    return Token.fromDatabase(result)
  }

  async createToken(token: Token) {
    const collection = 'tokens'
    const existingToken = await this.getToken({
      contractAddress: token.contractAddress,
      id: token.id,
    })
    if (existingToken) {
      throw new DbError(DbError.Type.ALREADY_EXISTS, 'token already exists')
    }
    const objToAdd = {...token, dateCreated: new Date().toISOString()}
    return this.db?.collection(collection).insertOne(objToAdd)
  }

  async updateToken(token: Token) {
    const collection = 'tokens'
    return this.db
      ?.collection(collection)
      .findOneAndUpdate({id: token.id}, {$set: {...token}}, {upsert: true})
  }

  async createSmsTokenFor(phone: string, pendingCode: string, codeHash: string) {
    let user = await this.getUserByPhone(phone)
    if (!user) {
      user = new User(User.generateUUID(), phone)
      await this.createUser(user)
    }
    // user last sent code was less than 60 seconds ago ... reject
    if (user.lastSentCode > Date.now() + 60 * 1000) {
      throw new DbError(
        DbError.Type.UNINITIALIZED,
        'last sent code less than 60 seconds, wait before sending'
      )
    }
    user.pendingCode = pendingCode
    user.codeHash = codeHash
    user.lastSentCode = Date.now()

    return await this.updateUser(user)
  }

  async createCollection(collection: Collection) {
    const mongoCollection = 'collections'
    const existingToken = await this.getToken({
      id: collection.id
    })
    if (existingToken) {
      throw new DbError(DbError.Type.ALREADY_EXISTS, 'collection already exists')
    }
    if (!collection.uuid) {
      collection.addUUIDStamp()
    }
    const objToAdd = {...collection, dateCreated: new Date().toISOString()}
    return this.db?.collection(mongoCollection).insertOne(objToAdd)
  }

  async getCollectionByUUID(uuid: string) {
    const mongoCollection = 'collections'
    const result = await this.db?.collection(mongoCollection).findOne({uuid: uuid})
    if (!result) return null
    return Collection.fromDatabase(result)
  }


}

class DbError {
  private code: string
  private message: string
  static Type: {MISSING_REQUIRED_ENV_VAR: string; UNINITIALIZED: string; ALREADY_EXISTS: string}

  constructor(code: string, message: string) {
    this.code = code
    this.message = message
  }
}
DbError.Type = {
  MISSING_REQUIRED_ENV_VAR: 'ERR_MISSING_REQUIRED_ENV_VAR',
  UNINITIALIZED: 'ERR_UNINITIALIZED',
  ALREADY_EXISTS: 'ERR_ALREADY_EXISTS',
}
