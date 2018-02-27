const api = exports
const util = require('util')
const https = require('https')

api.account = function (userObject, callback) {
  const token = userObject.accountToken || userObject.accountToken
  let user = userObject
  const options = {
    hostname: 'api.guildwars2.com',
    path: '/v2/account',
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + token
    }
  }
  // TODO: Please simplify.
  https.get(options, function (response) {
    response.on('data', function (data) {
      switch (response.statusCode) {
        case 200:
          const httpsRequest = JSON.parse(data)
        //   console.log('httpsRequest', httpsRequest)
          const guilds = httpsRequest.guilds
          // Add information gathered with api call to user.
          user.accountToken = token
          user.accountId = httpsRequest.id
          user.accountName = httpsRequest.name
          user.accountGuilds = guilds
          user.accountCreated = httpsRequest.created
          user.accountWorld = httpsRequest.world.toString()
          user.accountAccess = httpsRequest.access
          user.accountCommander = httpsRequest.commander
          callback(null, user)
          break
        case 400:
          const httpsRequest400 = JSON.parse(data)
          switch (httpsRequest400.text) {
            case 'invalid key':
              console.log('info', 'Server responding with "Invalid key" -> ' + response.statusCode)
              if (user.token === undefined) {
                user.token = user.msg
              }
              user.apiServerStatus = response.statusCode
              user.apiServerStatusReason = httpsRequest400.text
              callback(user, null)
              break
            case 'ErrBadData':
              console.log('info', 'Server responding with "ErrBadData" -> ' + response.statusCode)
              if (user.token === undefined) {
                user.token = user.msg
              }
              user.apiServerStatus = response.statusCode
              user.apiServerStatusReason = httpsRequest400.text
              callback(user, null)
              break
            default:
              console.log('error', 'Server responding -> ' + response.statusCode + ': ' + util.inspect(httpsRequest400))
              if (user.token === undefined) {
                user.token = user.msg
              }
              user.apiServerStatus = response.statusCode
              callback(user, null)
              break
          }
          break
        case 403:
          const httpsRequest403 = JSON.parse(data)
          console.log('info', 'Server responding -> ' + response.statusCode + ': ' + util.inspect(httpsRequest403))
          if (user.token === undefined) {
            user.token = user.msg
          }
          user.apiServerStatus = response.statusCode
          callback(user, null)
          break
        case 502:
          console.log('info', 'Server not responding -> ' + response.statusCode)
          if (user.token === undefined) {
            user.token = user.msg
          }
          user.apiServerStatus = response.statusCode
          callback(user, null)
          break
        case 503:
          console.log('info', 'Server busy -> ' + response.statusCode)
          if (user.token === undefined) {
            user.token = user.msg
          }
          user.apiServerStatus = response.statusCode
          callback(user, null)
          break
      }
    })
    response.on('error', function (error) {
      if (error) console.log('error', 'Error on HTTPS request to API. ' + error)
      console.log('error', 'While calling \'api.guildwars.com/v2/account\'.' + ' token: \'' + token + '\'')
    })
  }).on('error', function (res) {
    console.log('debug', 'HTTP request failed during API-key validation.' + res)
  })
}
