const DBF = require('discordjs-bot-framework');
const Discord = require("discord.js");

module.exports = class ToggleCommand extends DBF.Command{
    constructor(){
        super({
             name: "toggleCommand", //is pretty much just another trigger, but can be used filter commands.
             triggers: ["toggle", "disable", "enable", "togglecommand", "disablecommand", "enablecommand"], //any message (excluding msg.client.Prefix) that will trigger this command.
             group: "Utils", //this command will come under this group in the automatic help message.
             description: "Enable / Disable a command or group in a channel or for the whole server.  List of all disabled commands will be shown when no command/group is specified.", //this will show in the help message
             example: ">>toggle cmd_name\n>>toggle group_name\n>>toggle",             
             reqArgs: true,
             guildOnly: true,
             reqUserPerms: ["MANAGE_GUILD"],
             reqBotPerms : ["EMBED_LINKS"]
        });
    }

    run(params = {"msg": msg, "args": args, "user" : user}){ //all the code for your command goes in here.
        let msg = params.msg; var args = params.args;
        if(!args)
            return listDisabledCommands();
        //filter out toggle and help, filter commands by group and name/triggers.  Will return an array of either 1 or many.
        let command = msg.client.commands.filter(cmd => (!cmd.areYou("toggle") && !cmd.areYou("help") && (cmd.areYou(args) || cmd.group.trim().toLowerCase() == args.trim().toLowerCase())));
        if(!command || !command[0])
            return msg.channel.send("Couldn't find any commands under `" + args + "`.  Usage: `toggle command_name`");
        if(command.length > 1)
            msg.channel.send("Would you like to toggle **" + command[0].group + "** for the whole server, or just this channel? Type `server` or `channel`.");
        else
            msg.channel.send("Would you like to toggle **" + command[0].name + "** for the whole server, or just this channel? Type `server` or `channel`.");
        
        const filter = m => m.author.id == msg.author.id;
        msg.channel.awaitMessages(filter, {maxMatches: 1, time: 10000}).then( collected => {
            if(!collected || collected.size == 0)
                return msg.channel.send("Timed out.  Please try again :)");
            let channelId = "all";
            if(collected.first().content.match("channel"))
                channelId = msg.channel.id;
            else if (!collected.first().content.match("server"))
                return msg.channel.send("Invalid choice.  Please try again :)");
            let enabled = 0;
            let disabled = 0;
            command.forEach(comm => {
                if( (channelId == "all" && msg.guild.disabledCommands.find(cmd => cmd == comm.name)) || (channelId != "all" && msg.channel.disabledCommands.find(cmd => cmd == comm.name)) ){
                    msg.client.enableCommand(msg.guild, channelId, comm.name);
                    enabled++;
                }else{
                    msg.client.disableCommand(msg.guild, channelId, comm.name);
                    disabled++;
                }
            });
            var message = "";
            if(command.length > 1)
                message = "Successfully disabled `" + disabled + "` and enabled `"+enabled+"` commands in group `" + command[0].group + "` ";
            else if(enabled == 1)
                message = "Successfully enabled `" + command[0].name + "` ";
            else
                message = "Successfully disabled `" + command[0].name + "` ";
            
            if(channelId == "all")
                message += "for **" + msg.guild.name + "**";
            else
                message += "for **" + msg.channel.name + "**";
            
            msg.channel.send(message);
                
        }).catch(err => msg.channel.send("Timed out.  Please try again :)" + err));            
        function listDisabledCommands(){
            let myEmbed = new Discord.RichEmbed();
            myEmbed.setColor(msg.guild.me.displayColor);
            myEmbed.setTitle("Disabled commands");
            let message = "";
            msg.guild.disabledCommands.forEach(cmd => message += "`"+cmd + "`\n");
            if(message == "") message = "N/A";
            myEmbed.addField("Server wide", message, true);
            message = "";
            msg.channel.disabledCommands.forEach(cmd => message += "`"+cmd + "`\n");
            if(message == "") message = "N/A";
            myEmbed.addField("This channel only", message, true);
            msg.channel.send("",{"embed": myEmbed});
        }
    }
}