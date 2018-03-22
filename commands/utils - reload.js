const DBF = require('discordjs-bot-framework');
const Discord = require("discord.js");

module.exports = class Restart extends DBF.Command{
    constructor(){
        super({
             name: "reload", //is pretty much just another trigger, but can be used filter commands.
             triggers: ["refresh"], //any message (excluding msg.client.Prefix) that will trigger this command.
             group: "Utils", //this command will come under this group in the automatic help message.
             ownerOnly : true, //if this command is to be used by the bot creator only.
             description: "Reloads specified command or group of commands", //this will show in the help message
             example: ">>reload utils\n>>reload play",             
             guildOnly : false, //any command that refers to a guild with the discord.js library will crash if it triggered in a dm channel.  This prevents that.
             reqArgs: true,
        });
    }
    run(params = {"msg": msg, "args": args, "user": user}){ //all the code for your command goes in here.
        let msg = params.msg; let args = params.args; let user = params.user;
        if(args && args.toLowerCase() == "local")
        {
            let reloaded = msg.client.reloadCommands(args);
            if(reloaded != null)
                return msg.channel.send("Successfully reloaded `" + reloaded + "` commands under `" + args + "`");
            else
                return msg.channel.send("Didn't reload any commands.");
        }
        else
        {
            snekfetch.get("http://"+msg.client.auth.webserver+"/manage/reload?pw="+msg.client.auth.password).then(r => r);
            msg.channel.send("Reloaded all commands on all servers.");           
        }
    }
}
