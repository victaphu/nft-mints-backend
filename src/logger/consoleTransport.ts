import zerg from 'zerg'
import {TLogMessage} from 'zerg/dist/types'
import {consoleNodeColorful} from 'zerg/dist/transports'
import {config} from 'src/config'
import {addLastLog} from './lastLogs'

function handler(logMessage: TLogMessage) {
  const date = new Date().toISOString()
  logMessage.message = `[${date}] ${logMessage.message}`

  addLastLog(logMessage)
  return logMessage
}

const transportToConsole = zerg.createListener({
  handler: (...args) => consoleNodeColorful(handler(...args)),
  levels: config.logger.levels.console,
})

export default transportToConsole
