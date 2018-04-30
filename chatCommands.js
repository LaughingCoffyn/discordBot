const chatCommands = exports
const moment = require('moment')

chatCommands.check = ({ message, client }) => {
    if (message.content === 'invite') {
        // fetch a new invite link, wait for the response of this API call then send
        // the link back.
        let link = client.generateInvite(['ADMINISTRATOR'])
            .then((link) => {
                console.log('link:', link)
                message.reply(`Here you go! ${link}`)
            })
            .catch((error) => {
                console.log('error', error)
                console.log('error.stack', error.stack)
            })
    }

    if (message.content === 'date') {
        console.log('date command', message)
        message.reply('Current date: ' + moment().format('LLLL'))
    }

    // Checking a users state in private chat.. I really want to find a global solution.. RETHINK this
    // approach!!
    if (message.content === 'status') {
        console.log('status command')
        console.log('Author', message.author.presence)
        message.reply('Checking status..')
        message.reply('Your current status is:', message.author.presence.status)
    }

    // TODO: Remove this or protect it better.
    if (message.content === '!!shutdown') {
        message.reply('shutting down now..')
        client.destroy()
    }

    // Chat command to check roles.
    if (message.content === 'role') {
        if (message.author.roles instanceof Array) {
            message.author.roles.map((role) => {
                console.log('role:', role)
            })
        }
        if (message.member) {
            let perms = message.member.permissions
            const myRole = perms.member.roles.find(`name`, `@alliance`)
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