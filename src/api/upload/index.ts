import {Request, Response, Router} from 'express'
import {generatePresignedUploadURL} from 'src/controller/upload'

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

function helloWorld(req: Request, res: Response) {
  res.send('hello, world!')
}

const init = (app: Router) => {
  console.log('init upload')
  app.get('/', helloWorld)
  app.get('/new/:name', getUploadURL)
}

export default init
