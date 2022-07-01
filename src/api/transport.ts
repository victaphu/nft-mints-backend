import {Response, Request, NextFunction} from 'express'
export const errorToObject = (error: Error) => ({
  message: error.message || error,
  stack: error.stack || undefined,
})

export const transport = (data: any, req: Request, res: Response, next: NextFunction) => {
  let error
  if (data instanceof Error) {
    if (res.statusCode < 400) {
      res.status(500)
    }
    error = errorToObject(data)
  }

  if (res.statusCode >= 400) {
    error = error || data || 'Unknown error'
    res.json({errors: Array.isArray(error) ? error : [error]})
    return
  }

  res.json(data)
}
