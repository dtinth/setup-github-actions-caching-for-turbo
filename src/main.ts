/* eslint-disable github/no-then */
import * as core from '@actions/core'
import Fastify from 'fastify'
import {spawn} from 'child_process'
import {
  createReadStream,
  createWriteStream,
  existsSync,
  openSync,
  statSync
} from 'fs'
import waitOn from 'wait-on'
import axios from 'axios'
import type {AxiosInstance} from 'axios'
import {pipeline} from 'stream/promises'
import {Readable} from 'stream'
import {Env} from 'lazy-strict-env'
import {z} from 'zod'

const serverPort = 41230
const serverLogFile = '/tmp/turbogha.log'

async function run(): Promise<void> {
  if (process.argv[2] === '--server') {
    return server()
  }
  try {
    // const ms: string = core.getInput('milliseconds')
    const out = openSync(serverLogFile, 'a')
    const err = openSync(serverLogFile, 'a')
    const child = spawn(process.argv[0], [process.argv[1], '--server'], {
      detached: true,
      stdio: ['ignore', out, err]
    })
    child.unref()
    core.info(`Launched child process: ${child.pid}`)
    core.info(`Server log file: ${serverLogFile}`)

    await waitOn({
      resources: [`http-get://localhost:${serverPort}`],
      timeout: 10000
    })
    core.info(`Server is now up and running.`)

    core.exportVariable('TURBO_API', `http://localhost:${serverPort}`)
    core.exportVariable('TURBO_TOKEN', 'turbogha')
    core.exportVariable('TURBO_TEAM', 'turbogha')
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

async function server(): Promise<void> {
  const fastify = Fastify({
    logger: true
  })
  fastify.get('/', async () => {
    return {ok: true}
  })
  fastify.delete('/self', async () => {
    setTimeout(() => process.exit(0), 100)
    return {ok: true}
  })
  fastify.addContentTypeParser(
    'application/octet-stream',
    (_req, _payload, done) => {
      done(null)
    }
  )
  fastify.put('/v8/artifacts/:hash', async request => {
    const hash = (request.params as {hash: string}).hash
    core.info(`Received artifact for ${hash}`)
    await saveCache(
      hash,
      +(request.headers['content-length'] || 0),
      request.raw
    )
    return {ok: true}
  })
  fastify.get('/v8/artifacts/:hash', async (request, reply) => {
    const hash = (request.params as {hash: string}).hash
    core.info(`Requested artifact for ${hash}`)
    const result = await getCache(hash)
    if (result === null) {
      reply.code(404)
      return {ok: false}
    }
    const [size, stream] = result
    if (size) {
      reply.header('Content-Length', size)
    }
    reply.header('Content-Type', 'application/octet-stream')
    return reply.send(stream)
  })
  await fastify.listen({port: serverPort})
}

const env = Env(
  z.object({
    ACTIONS_RUNTIME_TOKEN: z.string(),
    ACTIONS_CACHE_URL: z.string()
  })
)

// GitHub's Cache API
// Thanks: https://github.com/tonistiigi/go-actions-cache/blob/master/api.md

function getCacheClient(): AxiosInstance {
  return axios.create({
    baseURL: `${env.ACTIONS_CACHE_URL.replace(/\/$/, '')}/apis/_artifactcache`,
    headers: {
      Authorization: `Bearer ${env.ACTIONS_RUNTIME_TOKEN}`
    }
  })
}

async function saveCache(
  hash: string,
  size: number,
  stream: Readable
): Promise<void> {
  if (!env.valid) {
    core.info(`Using filesystem cache because cache API env vars are not set`)
    await pipeline(stream, createWriteStream(`/tmp/${hash}.tg.bin`))
    return
  }
  const client = getCacheClient()
  const {data} = await client
    .post(`/caches`, {
      key: `turbogha_${hash}`,
      version: 'turbogha_v2'
    })
    .catch(handleAxiosError('Unable to reserve cache'))
  const id = data.cacheID
  if (!id) {
    throw new Error('Unable to reserve cache')
  }
  core.info(`Reserved cache ${id}`)
  await client
    .patch(`/caches/${id}`, stream, {
      headers: {
        'Content-Length': size,
        'Content-Type': 'application/octet-stream',
        'Content-Range': `bytes 0-${size - 1}/*`
      }
    })
    .catch(handleAxiosError('Unable to upload cache'))
  await client
    .post(`/caches/${id}`, {size})
    .catch(handleAxiosError('Unable to commit cache'))
  core.info(`Saved cache ${id} for ${hash} (${size} bytes)`)
}

async function getCache(
  hash: string
): Promise<[number | undefined, Readable] | null> {
  if (!env.valid) {
    const path = `/tmp/${hash}.tg.bin`
    if (!existsSync(path)) return null
    const size = statSync(path).size
    return [size, createReadStream(path)]
  }
  const client = getCacheClient()
  const cacheKey = `turbogha-${hash}`
  const {data, status} = await client
    .get(`/caches`, {
      params: {
        keys: cacheKey,
        version: 'turbogha_v1',
      },
      validateStatus: s => s < 500
    })
    .catch(handleAxiosError('Unable to query cache'))
  core.info(`Cache lookup for ${cacheKey}: ${status} ${JSON.stringify(data)}`)
  if (data.cacheKey !== cacheKey) {
    core.info(`Cache key mismatch: ${data.cacheKey} !== ${cacheKey}`)
    return null
  }
  const resp = await axios.get(data.archiveLocation, {
    responseType: 'stream'
  })
  const size = +(resp.headers['content-length'] || 0)
  return [size, resp.data]
}

run()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleAxiosError(message: string): (err: any) => never {
  return err => {
    if (err.response) {
      const data = JSON.stringify(err.response.data)
      core.info(
        `Response status ${err.response.status}: ${err.response.statusText}`
      )
      core.info(`Response headers: ${JSON.stringify(err.response.headers)}`)
      core.info(`Response data: ${data}`)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      throw new Error(`${message}: ${err.message}`, {cause: err})
    }
    throw err
  }
}
