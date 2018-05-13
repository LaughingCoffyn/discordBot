const chatCommands = exports
const moment = require('moment')
const logger = require(`./logger`)
const util = require('util')

chatCommands.check = ({ message, client }) => {
    if (message.content === 'invite') {
        // fetch a new invite link, wait for the response of this API call then send
        // the link back.
        let link = client.generateInvite(['ADMINISTRATOR'])
            .then((link) => {
                logger.log(`debug`, `Method call 'generateInvite' link: ${link}`)
                message.reply(`Here you go! ${link}`)
            })
            .catch((error) => {
                logger.log(`debug`, `Method call 'generateInvite' error: ${error}`)
                logger.log(`debug`, `Method call 'generateInvite' error.stack: ${error.stack}`)
            })
    }

    if (message.content === 'date') {
        logger.log(`debug`, `Chat-command 'date' ${message}`)
        message.reply('Current date: ' + moment().format('LLLL'))
    }

    // Checking a users state in private chat.. I really want to find a global solution.. RETHINK this
    // approach!!
    if (message.content === 'status') {
        logger.log(`debug`, `Chat-command 'status'`)
        logger.log(`debug`, `Current user status: ${message.author.presence.status}`)
        message.reply(`Your current status is: ${message.author.presence.status}`)
    }

    // Chat command to check roles.
    if (message.content === 'role') {
        logger.log(`debug`, `Chat-command 'role'`)
        // if (message.author.roles instanceof Array) {
        //     message.author.roles.map((role, index) => {
        //         logger.log(`debug`, `[${index}] author.role: ${role}`)
        //     })
        // }
        if (message.member) {
            // TODO: Find a way to handle multiple roles as well, also this way of checking roles
            // is considered deprecated.
            let perms = message.member.permissions
            const myRole = perms.member.roles.find(`name`, `@alliance`)
            logger.log(`debug`, `Checking role(s): ${myRole}`)
            // Answer with ID & role only if this user is part of the specified role.
            if (myRole) {
                message.reply(`Your role id: ${myRole.id}, your role's name: ${myRole.name}`)
                // In any other case ask for registration
            } else {
                message.reply(`You are not assigned any roles please register using your API key.`)
            }
        }
    }
}