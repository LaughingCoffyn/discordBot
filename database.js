const database = exports
const mongoClient = require('mongodb').MongoClient
const util = require('util')
const logger = require(`./logger`)
const uri = 'mongodb://localhost:27017/discordBot'

// Creata a new Database, only executes if there is no database yet.
database.createDatabase = (callback) => {
    mongoClient.connect(uri, (err, db) => {
        if (err) callback(err, null)
        callback(null, db)
    })
}

// Update an existing dataset with the data you can fetch from the API.
database.updateUser = (clientObject, callback) => {
    mongoClient.connect(uri, (err, db) => {
        if (err) logger.log('error', 'While connecting to DB during updateAccountInformation.')
        let collection = db.collection('users')
        // Checking if the API is already in use. If so do not update. API keys should be used
        // uniquely.
        collection.find({accountToken: clientObject.accountToken}).limit(1).next((err, doc) => {
            logger.log(`debug`, `clientObject ${clientObject}`)
            if (err) {
              logger.log('error', 'While fetching for API key during updateAccountInformation.')
            }
            if (doc === null) {
                collection.update(
                    {
                        accountId: clientObject.accountId
                    },
                    { $set:
                        {
                            clientId: clientObject.clientId,
                            clientNickname: clientObject.clientNickname,
                            clientUpdatedAt: new Date().toJSON(),
                            accountToken: clientObject.accountToken,
                            accountId: clientObject.accountId,
                            accountWorld: clientObject.accountWorld,
                            accountName: clientObject.accountName,
                            accountGuilds: clientObject.accountGuilds,
                            accountCreated: clientObject.accountCreated,
                            accountAccess: clientObject.accountAccess,
                            accountCommander: clientObject.accountCommander
                        }
                    },
                    {
                        upsert: true
                    }).then((resolve) => {
                        logger.log(`${new Date().toJSON()} resolve:`, resolve)
                        callback(null, clientObject)
                        db.close()
                    }).catch((reject) => {
                        logger.log(`${new Date().toJSON()} reject:`, reject)
                        db.close()
                    }
                )
            } else {
                callback({error: `API-key already in use.`}, doc)
                db.close()
            }
        })
    })
}

 // Get client by clientId.
database.getClientByUid = (uid, callback) => {
    mongoClient.connect(uri, (err, db) => {
        if (err) logger.log('error', 'While connecting to DB during getApiKey.')
        let collection = db.collection('users')
        collection.find({clientId: uid}).limit(1).next((err, doc) => {
            logger.log(`debug`, `Method call 'collection.find({clientId: uid})' error: ` + util.inspect(err))
            logger.log(`debug`, `Method call 'collection.find({clientId: uid})' userobject: ` + util.inspect(doc))
            if (err) callback(err, null)
            callback(null, doc)
            db.close()
        })
    })
}
