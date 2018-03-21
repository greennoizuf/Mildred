const DBF = require('discordjs-bot-framework');
const Discord = require("discord.js");
const auth = require("../resources/auth.json");
const snekfetch = require("snekfetch");

module.exports = class Restart extends DBF.Command{
    constructor(){
        super({
             name: "restart", //is pretty much just another trigger, but can be used filter commands.
             triggers: ["restart"], //any message (excluding msg.client.Prefix) that will trigger this command.
             group: "Utils", //this command will come under this group in the automatic help message.
             ownerOnly : true, //if this command is to be used by the bot creator only.
             description: "Restarts the bot", //this will show in the help message
             example: ">>restart",             
             guildOnly : false, //any command that refers to a guild with the discord.js library will crash if it triggered in a dm channel.  This prevents that.
        });
    }
    run(params = {"msg": msg, "args": args, "user": user}){ //all the code for your command goes in here.
        let msg = params.msg; let args = params.args; let user = params.user;
        msg.channel.send("Restarting!").then(msg => {
            snekfetch.get("http://localhost:3001/restart?pw=" + auth.password).then( r => r);           
        });
    }
}