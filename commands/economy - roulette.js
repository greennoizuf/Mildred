const DBF = require('discordjs-bot-framework');
const Discord = require("discord.js");
const Promise = require("bluebird");
const Roulette = require("../classes/Store/roulette.js");

module.exports = class RouletteCmd extends DBF.Command{
    constructor(){
        super({
             name: "roulette", //is pretty much just another trigger, but can be used filter commands.
             triggers: ["spin"], //any message (excluding prefix) that will trigger this command.
             group: "Economy", //this command will come under this group in the automatic help message.
             ownerOnly : false, //if this command is to be used by the bot creator only.
             description: "Gamble your rice on the roulette wheel along with anyone else in the server that wants to join.", //this will show in the help message
             example: ">>roulette red|green|black amount\n>>spin green 50\n>>roulette black all",             
             guildOnly : true, //any command that refers to a guild with the discord.js library will crash if it triggered in a dm channel.  This prevents that.
             reqArgs: true,
             reqBotPerms : ["EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
        });
    }

    run(params = {"msg": msg, "args": args, "user": user}){ //all the code for your command goes in here.
        let msg = params.msg; let args = params.args; let user = params.user;
        let prefix = msg.guild && msg.guild.prefix ? msg.guild.prefix : msg.client.prefix;
        if(!args || !args.match(/(red|green|black)/gi) || !args.match(/(\d+|all|half)/gi))
            return msg.channel.send("Usage: `" + prefix +"roulette <red|green|black> amount`" ).catch(err => console.log(err));
        
        let amount = args.match(/\d+/g) ? parseInt(args.match(/\d+/g)[0]) : (args.match(/all/gi) ? msg.author.rep : Math.floor(msg.author.rep/2));
        let color = args.match(/(red|green|black)/gi)[0];

        if(!msg.author.rep)
            return msg.channel.send("**" + msg.member.displayName + "**, you don't have any rice to bet. Use `" + msg.guild.prefix + "daily` to claim your daily ration.").catch(err => console.log(err));
        else if(msg.author.rep < amount)
            return msg.channel.send("**" + msg.member.displayName + "**, you only have `" + msg.author.rep + "` rice to bet").catch(err => console.log(err));
        let draw = false;
        if(!msg.guild.roulette){
            msg.guild.roulette = new Roulette(msg.channel);
            draw = true;
        }
        if(msg.guild.roulette.userIn(msg.author.id))
            return msg.channel.send("**" + msg.member.displayName + "**, you're already in the roulette.").catch(err => console.log(err));
        msg.guild.roulette.addPlayer({name: msg.member.displayName, id: msg.author.id, bet: amount, team: color});
        
        if(draw)
            setTimeout(() => {
                msg.guild.roulette.draw().finally(() => {
                    delete msg.guild.roulette;
                }).catch(err => console.log(err));;
            },30000);
    }
};
