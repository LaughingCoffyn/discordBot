const apiKey = exports
const api = require(`./api`)
const database = require(`./database`)
const logger = require(`./logger`)
const util = require(`util`)
const helper = require(`./helper`)
const config = helper.getConfig()
const roleId = config.roleId

const revokeGuildMemberAccess = ({ guildMember }) => {
    logger.log(`debug`, `guildMember: ${guildMember}`)
    try {
        guildMember.removeRole(roleId)
            .then((resolve) => {
                logger.log(`info`, `Invalid accountToken - removing Role: ${resolve}`)
            })
            .catch((reject) => {
                logger.log(`debug`, `Invalid accountToken - removing Role reject: ${reject}`)
            })
    } catch (error) {
        logger.log(`debug`, `Error while trying to remove role from guildMember: ${error}`)
    }
}

const revokeMessageMemberRole = ({ message }) => {
    logger.log(`debug`, `Method call 'revokeMessageMemberRole' message: ${message}`)
    try {
        message.member.removeRole(roleId)
            .then((resolve) => {
                logger.log(`info`, `Removing Role: ${resolve}`)
                message.delete()
            })
            .catch((reject) => {
                logger.log(`debug`, `Removing Role reject: ${reject}`)
                message.delete()
            })
    } catch (error) {
        logger.log(`debug`, `Error while trying to remove role from messageMember ${error}`)
    }
}

apiKey.recheck = ({ guildMember }) => {
    // Rechecking API key on reconnect
    logger.log(`debug`, `GuildMember: ${guildMember}`);
    logger.log(`debug`, `GuildMember.user: ${guildMember.user}`);
    database.getClientByUid(guildMember.user.id, (err, doc) => {
        logger.log(`debug`, `Method call 'getClientByUid' error: ${err}`);
        logger.log(`debug`, `Method call 'getClientByUid' doc: ${util.inspect(doc)}`);
        if (doc) {
            // Recognized user, we have an entry.. recheck here!
            logger.log(`debug`, `Recognizing already existing user: ${util.inspect(doc)}`);
            if (doc.accountToken) {
                // IF we have a Token please recheck against the official API.
                // TODO: 3(three) cases here.
                // 1. Key is vaild - update current data.
                // 2. Invalid API key - Remove from database (soft delete?)
                // API not reachable.. keep current data and ignore for now? Error habdling needs to be
                // defined here!!!
                logger.log(`debug`, `Found account token: ${doc.accountToken}`);
                api.account({ userObject: doc })
                    .then((user) => {
                        logger.log(`debug`, `Resolving 'api.account' for user: ${user.accountName} - ${user.accountId}`)
                        // If we have a response we can assume there is an account attached to the key. If our
                        // database user and the game user have the same id this qualifies as a match.
                        if (user && user.accountId === doc.accountId) {
                            // Update account data here! Any of the game account related data might have changed
                            // so let's update it here.
                            // Response should at least match the accountId from the database, otherwise DO NOT update
                            database.updateUser(user, (err, res) => {
                                // Here the `err` will also callback because the API key is actually in use by the
                                // current user we are checking here.
                                logger.log(`debug`, `Method call 'database.updateUser' error: ${err}`);
                                logger.log(`debug`, `Method call 'database.updateUser' res: ${res}`);
                                // Make sure to grant role accordingly.
                                // Do we need additional checks here? What are the pre-requirements for a user to get
                                // access to our role(s)?
                                guildMember.addRole(roleId);
                            });
                        } else {
                            // Add error handling here if necessary.
                            logger.log(`debug`, `Method call 'api.account' error: ${err}`);
                        }
                    })
                    .catch((reject) => {
                        logger.log(`debug`, `Rejecting 'api.account': ${reject}`)
                    })
            }
            // Make sure to remove the role if the user has no accountToken.
            if (!doc.accountToken) {
                logger.log(`debug`, `User with invalid accountToken: ${doc.accountToken}`);
                // Revoke access here!
                revokeGuildMemberAccess({ guildMember });
            }
        }
        // Database is working as expected and we don't know this user. What's next? Maybe send an invite?
        if (err === null && doc === null) {
            logger.log(`debug`, `User without data - revoking Role: ${guildMember}`);
            // Make sure to remove guild roles if they are present
            revokeGuildMemberAccess({ guildMember });
        }
    });
}

// Validates an API key that got sent via a chat message
apiKey.validateAccountData = ({ message }) => {
    logger.log(`debug`, `Method call 'apiKey.validateAccountData' message: ${message}`)
    if (message.content) {
        let chatMessage = message.content.split(' ')
        if (chatMessage[1].length === 72) {
            message.author.accountToken = chatMessage[1]
        }
    } else {
        //Grab API key from the database
    }
    api.account({ userObject: message.author })
        .then((user) => {
            database.updateUser(user, (err, res) => {
                // Compare user form database with user from chat. Then act upon it
                logger.log(`debug`, `Method call 'database.udateUser': ${res}`)
                logger.log(`debug`, `Method call 'database.udateUser': ${message.author}`)

                if (res.id === message.author.id) {

                }
                if (err) {
                    logger.log(`debug`, `Method call 'database.updateUser' error: ${err}`)
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
                            logger.log(`debug`, `Method call message.member.addRole - resolve: ${resolve}`)
                            message.delete()
                        })
                        .catch((reject) => {
                            logger.log(`debug`, `Method call message.member.addRole - reject: ${reject}`)
                            message.delete()
                        })
                }
            })
        })
        .catch((reject) => {
            logger.log(`debug`, `Rejecting while calling 'api.account': ${reject}`)
        })
}