import * as core from '@actions/core'
import {inspect} from 'util'

async function run(): Promise<void> {
  try {
    // const ms: string = core.getInput('milliseconds')
    core.info(inspect(process.argv))
    core.debug(new Date().toTimeString())
    core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
