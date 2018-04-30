const apiKey = exports
const api = require('./api')
const database = require('./database')

const roleId = `420199612675129345`


const revokeGuildMemberAccess = ({ guildMember }) => {
    console.log(`guildMember`, guildMember)
    try {
        guildMember.removeRole(roleId)
            .then((resolve) => {
                console.log(`${new Date().toJSON()} Invalid accountToken - removing Role:`, resolve)
            })
            .catch((reject) => {
                console.error
                console.log(`${new Date().toJSON()} reject`, reject)
            })
    } catch (error) {
        console.log(`${new Date().toJSON()} Error while trying to remove role from guildMember`, error)
    }
}

const revokeMessageMemberRole = ({ message }) => {
    console.log(`MESSAGE`, message)
    try {
        message.member.removeRole(roleId)
            .then((resolve) => {
                console.log(`${new Date().toJSON()} removeRole:`, resolve)
                message.delete()
            })
            .catch((reject) => {
                console.error
                console.log(`${new Date().toJSON()} reject`, reject)
                message.delete()
            })
    } catch (error) {
        console.log(`${new Date().toJSON()} Error while trying to remove role from messageMember`, error)
    }
}

apiKey.recheck = ({ guildMember }) => {
    // Rechecking API key on reconnect
    console.log(`GuildMember:`, guildMember);
    console.log(`GuildMember.user:`, guildMember.user);
    database.getClientByUid(guildMember.user.id, (err, doc) => {
        console.log(`getClientByUid err`, err);
        console.log(`getClientByUid doc`, doc);
        if (doc) {
            // Recognized user, we have an entry.. recheck here!
            console.log(`Recognizing already existing user!\n`, doc);
            if (doc.accountToken) {
                // IF we have a Token please recheck against the official API.
                // TODO: 3(three) cases here.
                // 1. Key is vaild - update current data.
                // 2. Invalid API key - Remove from database (soft delete?)
                // API not reachable.. keep current data and ignore for now? Error habdling needs to be
                // defined here!!!
                console.log(`Found account token!\n`, doc.accountToken);
                api.account(doc, (err, res) => {
                    console.log(`api account err`, err);
                    console.log(`api account res`, res);
                    // If we have a response we can assume there is an account attached to the key. If our
                    // database user and the game user have the same id this qualifies as a match.
                    if (res && res.accountId === doc.accountId) {
                        // Update account data here! Any of the game account related data might have changed
                        // so let's update it here.
                        // Response should at least match the accountId from the database, otherwise DO NOT update
                        database.updateUser(res, (err, res) => {
                            // Here the `err` will also callback because the API key is actually in use by the
                            // current user we are checking here.
                            console.log(`Done updating user error`, err);
                            console.log(`Done updating user res`, res);
                            // Make sure to grant role accordingly.
                            // Do we need additional checks here? What are the pre-requirements for a user to get
                            // access to our role(s)?
                            guildMember.addRole(roleId);
                        });
                    }
                    else {
                        // Add error handling here if necessary.
                        console.log(`Error while checking account @API`, err);
                    }
                });
            }
            // Make sure to remove the role if the user has no accountToken.
            if (!doc.accountToken) {
                console.log(`User with invalid accountToken`, doc.accountToken);
                // Revoke access here!
                revokeGuildMemberAccess({ guildMember });
            }
        }
        // Database is working as expected and we don't know this user. What's next? Maybe send an invite?
        if (err === null && doc === null) {
            console.log(`${new Date().toJSON()} User without data!`);
            // Make sure to remove guild roles if they are present
            revokeGuildMemberAccess({ guildMember });
        }
    });
}

apiKey.validateAccountData = ({ message }) => {
    console.log(`${new Date().toJSON()} message:`, message)
    // console.log(`chatMessage:`, chatMessage)
    if (message.content) {
        let chatMessage = message.content.split(' ')
        if (chatMessage[1].length === 72) {
            message.author.accountToken = chatMessage[1]
        }
    } else {
        //Grab API key from the database
    }
    api.account(message.author, (err, res) => {
        if (err) console.log(`${new Date().toJSON()} response from API:`, err)
        database.updateUser(res, (err, res) => {
            // Compare user form database with user from chat. Then act upon it
            console.log(`${new Date().toJSON()} Database user:`, res)
            console.log(`${new Date().toJSON()} messageauthor:`, message.author)

            if (res.id === message.author.id) {

            }
            if (err) {
                console.log(`${new Date().toJSON()} err`, err)
                message.reply(`${err.error}`)
                message.delete()
                // Registration key already in use
                if (err.error === `API-key already in use.`) {
                    // Removing the role should also remove the `accountToken` from an account
                    // TODO: IF I send my key twice I will lose my access.. please rethink this one!
                    revokeMessageMemberRole({ message })
                }
            } else {
                // TODO: Have the roleID stored somewhere please.
                message.member.addRole(roleId)
                    .then((resolve) => {
                        console.log(`resolve`, resolve)
                        message.delete()
                    })
                    .catch((reject) => {
                        console.error
                        console.log(`${new Date().toJSON()} reject`, reject)
                        message.delete()
                    })
            }
        })
    })
}