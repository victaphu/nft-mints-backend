import {Request} from 'express'

export interface SerializerOptions {
  request: Request | null
}

export const defaultSerializerOptions = {
  request: null,
}
