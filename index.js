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

client.on('ready', async () => {
  console.log('i am ready!')
  database.createDatabase((err, res) => {
    if (err) console.log('err', err)
    // console.log('res', res)
  })
})

client.on('message', message => {
  // console.log('message', message)
  // console.log('message.content', message.content)


  // It's good practice to ignore other bots.
  // This also makes your bot ignore itself
  if (message.author.bot) {
    return
  }
  if (message.content === 'test') {
    // console.log('message', message)
    // console.log('message.author', message.author)
    // Send a question to a channel and await the answer. Respond
    message.channel.send('What tag would you like to see?' +
        ' This will await will be cancelled in 10 seconds.' +
        ' It will finish when you provide a message that goes through the filter the first time.'
      )
      .then(() => {
        message.channel.awaitMessages(response => response.content === 'oi', {
          max: 1,
          time: 10000,
          errors: ['time'],
      })
      .then((collected) => {
        message.channel.send(`The collected message was: ${collected.first().content}`)
      })
      .catch(() => {
        message.channel.send('There was no collected message that passed the filter within the time limit!')
      })
    })
  }
  if (message.content === 'Hey') {
    message.delete()
      .then((text) => {
        console.log('text', text)
      })
      .catch((error) => {
        console.log('error', error)
      })
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
  if (message.content === '!!shutdown') {
    message.reply('shutting down now..')
    client.destroy()
  }
  if (message.content === '$guildMemberAdd') {
    // console.log('message.author', message.author)
    // console.log('message.member', message.member)
    client.emit("Emitting guildMemberAdd event", message.author)
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
    const userMessage = message.content.split(' ')
    if (userMessage[1].length === 72) {
      // The message here is supposed to come from a text based channel. We should remove the
      // message containing the API key so it can not be abused.
      message.delete()
      //Implement the actual call to the API
      message.author.accountToken = userMessage[1]
      api.account(message.author, (err, res) => {
        if (err) console.log(`err`, err)
        database.updateUser(res, (err, res) => {
          if (err) {
            console.log(`err`, err)
          } else {
            message.member.addRole(`420199612675129345`)
            .then((resolve) => {
              console.log(`resolve`, resolve)
            })
            .catch((reject) => {
              console.log(`reject`, reject)
            })
          }
        })
      })
    }
  }
})

client.on("guildMemberAdd", (member) => {
  // console.log(`New User "${member.user.username}" has joined "${member.guild.name}"` )
  // member.guild.channels.get("welcome").send(`"${member.user.username}" has joined this server`)
})

client.login(TOKEN)

// Debugging logs. Note from the docs: The debug event WILL output your token,
// so exercise caution when handing over a debug log.
client.on("error", (e) => console.error(`error`, e))
client.on("warn", (e) => console.warn(`warning`, e))
client.on("debug", (e) => console.info(`debug`, e))

// Emmiting events for testing.. Where 'guildMemberAdd' can be any envent.
// client.emit("guildMemberAdd", message.member)
