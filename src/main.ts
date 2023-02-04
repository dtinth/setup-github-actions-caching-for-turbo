import * as core from '@actions/core'
import {inspect} from 'util'
import Fastify from 'fastify'
import {spawn} from 'child_process'
import {openSync} from 'fs'
import waitOn from 'wait-on'

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

    await waitOn({
      resources: [`http-get://localhost:${serverPort}`],
      timeout: 10000
    })
    core.info(`Server is running now!`)

    core.debug(new Date().toTimeString())
    core.setOutput('time', new Date().toTimeString())
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
  await fastify.listen({port: serverPort})
}

run()
