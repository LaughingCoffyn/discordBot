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
    // console.log('res', res)
  })
})

function recheckAPIKey(guildMember) {
  console.log(`GuildMember:`, guildMember)
}

function validateAccountData({message}) {
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
      if (err) {
        console.log(`${new Date().toJSON()} err`, err)
        message.reply(`${err.error}`)
        message.delete()
        // Registration key already in use
        if (err.error === `API-key already in use.`) {
          // Removing the role should also remove the `accountToken` from an account
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
        }
      } else {
        // Have the roleID stored somewhere please.
        message.member.addRole(roleId)
        .then((resolve) => {
          console.log(`resolve`, resolve)
          console.log(`${new Date().toJSON()} userRole`, message.member.permissions.member.roles.find(roleId))
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

  if (message.content === 'role') {
    // console.log('author', message.author)
    // console.log('message.author.roles', message.author.roles)
    if (message.author.roles instanceof Array) {
      message.author.roles.map((role) => {
        console.log('role:', role)
      })
    }
    if (message.member) {
      let perms = message.member.permissions
      console.log(`perms`, perms)
      const myRole = perms.member.roles.find(`name`, `@alliance`)
      console.log(`myRole`, myRole)
      // Answer with roles only if there are any
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
    recheckAPIKey(e)
  }

})

// Emmiting events for testing.. Where 'guildMemberAdd' can be any envent.
// client.emit("guildMemberAdd", message.member)
