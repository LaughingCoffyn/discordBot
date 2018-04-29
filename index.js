const moment = require('moment')
const Discord = require('discord.js')
const TOKEN = process.env.JERRY_TOKEN
const api = require('./api')
const database = require('./database')
const client = new Discord.Client({
  disableEveryone: true,
  messageCacheMaxSize: 500,
  messageCacheLifetime: 120,
  messageSweepInterval: 60,
})

const roleId = `420199612675129345`

client.on('ready', async () => {
  console.log('i am ready!')
  database.createDatabase((err, res) => {
    if (err) console.log('err', err)
    console.log('res', res)
  })
})

const revokeGuildMemberAccess = ({guildMember}) => {
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

revokeMessageMemberRole = ({message}) => {
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

const recheckAPIKey = ({guildMember})  => {
  // Rechecking API key on reconnect
  console.log(`GuildMember:`, guildMember)
  console.log(`GuildMember.user:`, guildMember.user)
  database.getClientByUid(guildMember.user.id, (err, doc) => {
    console.log(`getClientByUid err`, err)
    console.log(`getClientByUid doc`, doc)
    if (doc) {
      // Recognized user, we have an entry.. recheck here!
      console.log(`Recognizing already existing user!\n`, doc)
      if (doc.accountToken) {
        // IF we have a Token please recheck against the official API.
        // TODO: 3(three) cases here.
        // 1. Key is vaild - update current data.
        // 2. Invalid API key - Remove from database (soft delete?)
        // API not reachable.. keep current data and ignore for now? Error habdling needs to be
        // defined here!!!
        console.log(`Found account token!\n`, doc.accountToken)
        api.account(doc, (err, res) => {
          console.log(`api account err`, err)
          console.log(`api account res`, res)
          // If we have a response we can assume there is an account attached to the key. If our
          // database user and the game user have the same id this qualifies as a match.
          if (res && res.accountId === doc.accountId) {
            // Update account data here! Any of the game account related data might have changed
            // so let's update it here.
            // Response should at least match the accountId from the database, otherwise DO NOT update
            database.updateUser(res, (err, res) => {
              // Here the `err` will also callback because the API key is actually in use by the
              // current user we are checking here.
              console.log(`Done updating user error`, err)
              console.log(`Done updating user res`, res)
              // Make sure to grant role accordingly.
              // Do we need additional checks here? What are the pre-requirements for a user to get
              // access to our role(s)?
              guildMember.addRole(roleId)
            })
          } else {
            // Add error handling here if necessary.
            console.log(`Error while checking account @API`, err)
          }
        })
      }
      // Make sure to remove the role if the user has no accountToken.
      if (!doc.accountToken) {
        console.log(`User with invalid accountToken`, doc.accountToken)
        // Revoke access here!
        revokeGuildMemberAccess({guildMember})
      }
    }
    // Database is working as expected and we don't know this user. What's next? Maybe send an invite?
    if (err === null && doc === null) {
      console.log(`${new Date().toJSON()} User without data!`)
      // Make sure to remove guild roles if they are present
      revokeGuildMemberAccess({guildMember})
    }
  })
}

const validateAccountData = ({message}) => {
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
          revokeMessageMemberRole({message})
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

client.on('message', message => {
  // It's good practice to ignore other bots.
  // This also makes your bot ignore itself
  if (message.author.bot) {
    return
  }

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
    console.log('date command')
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
  // We are expecting a text message like:
  //`!verify XXXXXX-XXXXXX-XXXXXX-XXXXXXX-XXXXXXXXXX-XXXXXXXXX-XXXXXXXX-XXXXXXXXXXXXX`
  // The API key gets validated and the the user objectgets stored in the database
  // We remove the text message thus the API key from the text channel
  // and grant the related role.
  if (/^!verify/.test(message.content.toLowerCase())) {
    const chatMessage = message.content.split(' ')
    if (chatMessage[1].length === 72) {
      // The message here is supposed to come from a text based channel. We should remove the
      // message containing the API key so it can not be abused.
      validateAccountData({message})
    }
  }
})

client.login(TOKEN)

// Debugging logs. Note from the docs: The debug event WILL output your token,
// so exercise caution when handing over a debug log.
client.on("error", (e) => console.error(`${new Date().toJSON()} error`, e))
client.on("warn", (e) => console.warn(`${new Date().toJSON()} warning`, e))
client.on("debug", (e) => console.info(`${new Date().toJSON()} debug`, e))

// Detectingthe presence of a user.. we might have to check the previous state here as well
// to ensure if was `offline` before and is `online` now.. Do I really need to do that?!
// Do I really want to do this? One way would be  wo store that information in the local database
// and then check the database everytime a state changes for the database informtaion.. not really
// a problem but I would like to find a better way!!
client.on('presenceUpdate', (e) => {
  // console.info(`${new Date().toJSON()} debug`, e)
  // console.log(`${new Date().toJSON()} presence event fired and received!!!!!`)
  // Frozen presence is the last tate before the current one (the one the user just changed to).
  // console.log(`Last known presence state`, e.frozenPresence.status)
  // console.log(`Current presence state`, e.user.presence.status)

  // When a user comes online - Recheck the current API key.
  if (e.frozenPresence.status !== `online` && e.user.presence.status) {
    // Recheck API key here
    console.log(`User just came online`)
    recheckAPIKey({guildMember: e})
  }

})

// Emmiting events for testing.. Where 'guildMemberAdd' can be any envent.
// client.emit("guildMemberAdd", message.member)
