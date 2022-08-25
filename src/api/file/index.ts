import {Request, Response, Router} from 'express'
import {generatePresignedUploadURL, generatePresignedGetURL} from 'src/controller/file'

const getUploadURL = async (req: Request, res: Response) => {
  try {
    return res.json(await generatePresignedUploadURL(req.params.name, 'staging'))
  } catch (e) {
    console.error(e)
    return res.status(500).send()
  }
}

const init = (app: Router) => {
  console.log('init file')
  app.get('/new/:name', getUploadURL)
}

export default init
