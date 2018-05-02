const helper = exports
const util = require('util')
const logger = require('./logger')

helper.getConfig = () => {
    try {
        const config = JSON.parse(require('fs').readFileSync('config.json'))
        return config
    } catch (e) {
        logger.log(`debug`, ` Failed to load config. ` + util.inspect(e) + '\n')
    }
}
