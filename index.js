const Discord = require('discord.js')
const TOKEN = process.env.JERRY_TOKEN
const api = require('./api')
const database = require('./database')
const apiKey = require('./apiKey')
const chatCommands = require('./chatCommands')

const client = new Discord.Client({
  disableEveryone: true,
  messageCacheMaxSize: 500,
  messageCacheLifetime: 120,
  messageSweepInterval: 60,
})

const roleId = `420199612675129345`
const admins = ['347687241772040192']

// Secret login token.
client.login(TOKEN)

client.on('ready', async () => {
  database.createDatabase((err, res) => {
    if (err) console.log('err', err)
    console.log('res', res)
  })
})

client.on('message', message => {
  // It's good practice to ignore other bots.
  // This also makes your bot ignore itself
  if (message.author.bot) {
    return
  }

  // Check if a user is in the list of admins.
  const isAdmin = admins.some((adminId) => adminId === message.author.id )

  // Admin only commands.
  if (isAdmin) {
    chatCommands.check({message, client})
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
      apiKey.validateAccountData({message})
    }
  }
})


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
  // Frozen presence is the last state before the current one (the one the user just changed to).
  // console.log(`Last known presence state`, e.frozenPresence.status)
  // console.log(`Current presence state`, e.user.presence.status)

  // When a user comes online - Recheck the current API key.
  if (e.frozenPresence.status !== `online` && e.user.presence.status) {
    // Recheck API key here
    console.log(`User just came online`)
    apiKey.recheck({guildMember: e})
  }
})

// Emmiting events for testing.. Where 'guildMemberAdd' can be any envent.
// client.emit("guildMemberAdd", message.member)
