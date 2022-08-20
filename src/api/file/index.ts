import {Request, Response, Router} from 'express'
import {generatePresignedUploadURL, generatePresignedGetURL} from 'src/controller/file'

const getUploadURL = async (req: Request, res: Response) => {
  // TODO: Auth check
  try {
    const user = req.session.userUuid
    return res.json(await generatePresignedUploadURL(req.params.name, user!))
  } catch (e) {
    console.error(e)
    return res.status(500).send()
  }
}

const getExistingFileURL = async (req: Request, res: Response) => {
  // TODO: Auth check, we may not even want a publically available access point here.
  try {
    return res.json(await generatePresignedGetURL(<string>req.query.key))
  } catch (e) {
    console.error(e)
    return res.status(500).send()
  }
}

const init = (app: Router) => {
  console.log('init file')
  app.get('/get', getExistingFileURL)
  app.get('/new/:name', getUploadURL)
}

export default init
