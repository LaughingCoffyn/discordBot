# discordBot
Manage a single [discord](https://discordapp.com/) group you can register to using a valid [API key](https://account.arena.net/applications ).
### Dependencies
* [Mongodb](https://docs.mongodb.com/manual/installation/)
* [Node.js](https://nodejs.org/en/)
* [Git](https://git-scm.com/)
### Installation
1. [Download the Repository](https://github.com/LaughingCoffyn/discordBot)
```bash
git clone https://github.com/LaughingCoffyn/discordBot.git
```
2. Navigate to the root folder of the application and execute:
```bash
npm install
```
3. Start the application
```bash
node .
```
4. You will need to register your App [@Discord](https://discordapp.com/developers/applications/me). create a Bot user and  genereate a new Token. Publish that token as environmental variable on your system
```bash
echo "export TOKEN=YOURTOKEN" >> .bashrc
```
```bash
source .bashrc
```
```bash
echo $TOKEN
```