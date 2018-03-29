const database = exports
const mongoClient = require('mongodb').MongoClient
const uri = 'mongodb://localhost:27017/discordBot'

// Creata a new Database, only executes if there is no database yet.
database.createDatabase = function (callback) {
  mongoClient.connect(uri, function (err, db) {
    if (err) callback(err, null)
    callback(null, db)
  })
}

// Update an existing dataset with the data you can fetch from the API.
database.updateUser = function (clientObject, callback) {
    mongoClient.connect(uri, function (err, db) {
      if (err) console.log('error', 'While connecting to DB during updateAccountInformation.')
      var collection = db.collection('users')
      // Checking if the API is already in use. If so do not update. API keys should be used
      // uniquely.
      collection.find({accountToken: clientObject.accountToken}).limit(1).next(function (err, doc) {
        if (err) {
          console.log('error', 'While fetching for API key during updateAccountInformation.')
        }
        if (doc === null) {
          collection.update(
            {
              accountId: clientObject.accountId
            },
            {
              clientId: clientObject.id,
              clientNickname: clientObject.username,
              clientUpdatedAt: new Date().toJSON(),
              accountToken: clientObject.accountToken,
              accountId: clientObject.accountId,
              accountWorld: clientObject.accountWorld,
              accountName: clientObject.accountName,
              accountGuilds: clientObject.accountGuilds,
              accountCreated: clientObject.accountCreated,
              accountAccess: clientObject.accountAccess,
              accountCommander: clientObject.accountCommander
            },
            {
              upsert: true
            }).then((resolve) => {
              console.log(`resolve`, resolve)
              callback(null, clientObject)
              db.close()
            }).catch((reject) => {
              console.log(`reject`, reject)
              db.close()
            }
          )
        } else {
          callback({error: `API-key already in use.`}, null)
          db.close()
        }
     })
  })
}
