import {randomUUID} from 'crypto'
import mime from 'mime-types'
import AWS from 'aws-sdk'

const ONE_HOUR = 60 * 60

const config = {
  endpoint: process.env.AWS_ENDPOINT,
  bucket: process.env.AWS_BUCKET,
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_IDENTITY,
  accessKeySecret: process.env.AWS_ACCESS_SECRET,
}
Object.entries(config).forEach(([k, v]) => {
  // endpoint is optional
  if (k === 'endpoint') return true
  if (!v) {
    throw new Error(
      `Expected value for ${k}. Ensure AWS_REGION, AWS_BUCKET, AWS_ACCESS_IDENTITY, and AWS_ACCESS_SECRET are all defined.`
    )
  }
})

const s3 = new AWS.S3({
  endpoint: config.endpoint || undefined,
  region: config.region,
  signatureVersion: 'v4',
  credentials: {accessKeyId: config.accessKeyId!, secretAccessKey: config.accessKeySecret!},
})

/**
 * Generates a presigned URL and corresponding data that should be encoded as multipart form data
 * Note: It looks like, unlike AWS, DO Spaces ignores out contentType and encoding. Leaving it in case they
 * add support later, but it's not strictly required for our app to function.
 * @param name {string} The filename
 * @param prefix {string} prefix for the key
 */
export async function generatePresignedUploadURL(name: string, prefix: string) {
  const safeName = sanitizeName(name)
  const ext = getExtension(safeName)
  const key = generateKey(prefix) + ext
  const contentType = getContentType(ext)
  const disposition = `inline; filename="${safeName}"`

  const output = await s3.createPresignedPost({
    Bucket: config.bucket,
    Fields: {
      key: key,
      'Content-Disposition': disposition,
      'Content-Type': contentType,
    },
    Expires: ONE_HOUR,
  })

  const meta = {
    name: name,
    safe_name: safeName,
    key: key,
    extension: ext,
    content_type: contentType,
  }

  return {...output, meta}
}

/**
 * Returns a URL that can access an existing file. Valid for one hour.
 * @param key {string}
 */
export async function generatePresignedGetURL(key: string) {
  return s3.getSignedUrl('getObject', {
    Bucket: config.bucket,
    Key: key,
    Expires: ONE_HOUR,
  })
}

export async function staticOrLookupFile(s3KeyOrStaticURL: string) {
  if (!s3KeyOrStaticURL) return ''

  const s = s3KeyOrStaticURL.toLowerCase()
  if (s.startsWith('http://') || s.startsWith('https://')) {
    return s3KeyOrStaticURL
  } else {
    return generatePresignedGetURL(s3KeyOrStaticURL)
  }
}

export async function copy(existingPath: string, targetPath: string) {
  return s3
    .copyObject({
      Bucket: config.bucket!,
      CopySource: `${config.bucket!}/${existingPath}`,
      Key: targetPath,
    })
    .promise()
}

export async function remove(key: string, ignoreFailure = false) {
  try {
    const result = await s3
      .deleteObject({
        Bucket: config.bucket!,
        Key: key,
      })
      .promise()
  } catch (e) {
    if (!ignoreFailure) throw e
  }
}

export async function move(existingPath: string, targetPath: string) {
  await copy(existingPath, targetPath)
  return remove(existingPath)
}

function sanitizeName(s: string) {
  return s.replace(/[^\w.-]+/, '')
}

function getExtension(s: string) {
  const aux = s.match(/\.[\da-zA-Z]+$/i)
  if (aux?.length) return aux[0]
  return ''
}

/**
 * @param {string} prefix Prefix (usually a folder structure) to prepend to key
 * @param {string} existingKey If provided, the extension from the existing key will be appended
 * @return {string} newly generated key
 */
export function generateKey(prefix: string, existingKey = '') {
  let ext = ''
  if (existingKey) ext = getExtension(existingKey)
  return `${prefix}/${randomUUID()}${ext}`
}

function getContentType(name: string) {
  return mime.lookup(name)
}
