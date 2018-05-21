const api = exports
const util = require('util')
const https = require('https')
const logger = require(`./logger`)

api.account = (userObject) => {
    logger.log(`debug`, `Method call 'api.account' param received: ${userObject}`)
    return new Promise((resolve, reject) => {
        // TODO: Handle 'undefined' token here? Return early?
        const token = userObject.accountToken
        let user = userObject
        const options = {
            hostname: 'api.guildwars2.com',
            path: '/v2/account',
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + token
            }
        }

        https.get(options, (response) => {
            // Make sure this can handle chunked data!
            response.on('data', (data) => {
                try {
                    // Parse the date reveived here.
                    const httpsRequest = JSON.parse(data)
                    const guilds = httpsRequest.guilds
                    // Add information gathered with api call to user.
                    user = {
                        accountToken: token,
                        accountId: httpsRequest.id,
                        accountName: httpsRequest.name,
                        accountGuilds: guilds,
                        accountCreated: httpsRequest.created,
                        accountWorld: httpsRequest.world.toString(),
                        accountAccess: httpsRequest.access,
                        accountCommander: httpsRequest.commander,
                    }

                } catch (error) {
                    logger.log(`debug`, `Event handler 'onData' in 'https.get' - Failed to parse data: ${error}`)
                    reject(error)
                }
            })
            response.on(`end`, () => {
                logger.log(`debug`,`Event handler 'onEnd' in 'https.get'`)
                resolve(user)
            })
            response.on(`error`, (error) => {
                logger.log('error', 'Error on HTTPS request to API. ' + error)
                logger.log('error', 'While calling \'api.guildwars.com/v2/account\'.' + ' token: \'' + token + '\'')
            })
        }).on(`error`, (res) => {
            logger.log('debug', 'HTTP request failed during API-key validation.' + res)
        })
    })
}
