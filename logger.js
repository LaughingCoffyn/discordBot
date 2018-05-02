const logger = exports
const path = require('path')
const fs = require('fs')
const helper = require('./helper')
const config = helper.getConfig()
const util = require('util')

logger.debuglevel = config.debuglevel
fs.openSync(path.join(__dirname, '/log'), 'a')

logger.log = (level, message) => {
    const levels = ['error', 'warning', 'info', 'debug']
    if (levels.indexOf(level) <= levels.indexOf(logger.debuglevel)) {
        if (typeof message !== 'string') {
            try {
                message = JSON.stringify(message)
            } catch (error) {
                logger.log(`debug`, `Logger failed to parse JSON`, error)
                message = util.inspect(message)
            }
        }
        console.log(`${new Date().toJSON()} ${level} ${message}`)
        fs.appendFile(path.join(__dirname, '/log'), `${new Date().toJSON()} ${level} ${message} \n`, (err) => {
            if (err) {
                logger.log('error', 'Failed to write to log file!')
            }
        })
    }
}
