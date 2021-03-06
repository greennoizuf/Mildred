const DBF = require('discordjs-bot-framework');
const Discord = require("discord.js");

module.exports = class StoreCmd extends DBF.Command{
    constructor(){
        super({
             name: "store", //is pretty much just another trigger, but can be used filter commands.
             triggers: ["shop"], //any message (excluding prefix) that will trigger this command.
             group: "Economy", //this command will come under this group in the automatic help message.
             ownerOnly : false, //if this command is to be used by the bot creator only.
             description: "Spend all of your hard earned rice.", //this will show in the help message
             example: ">>store\n>>store buy item_name\n>>store buy love",             
             guildOnly : true, //any command that refers to a guild with the discord.js library will crash if it triggered in a dm channel.  This prevents that.
             reqArgs: true
        });
    }

    run(params = {"msg": msg, "args": args, "user": user}){ //all the code for your command goes in here.
        let msg = params.msg, args = params.args;
        
        /*
            Purchase an Item.
        */
        if(args && args.match(/(buy)|(purchase)/gi))
        {
            let itemID = (args.replace(/(buy)|(purchase)/gi,"").trim() + " ").split(" ")[0];
            let item = msg.client.store.fetchItem(itemID);
            if(!item)
                return msg.channel.send(`:convenience_store: Sorry, I'm not selling any \`${itemID}\`'s`);
            else
            {
                if(!msg.author.rep || msg.author.rep < item.price)
                    return msg.channel.send(`:convenience_store: It doesn't look like you can afford \`${item.price}\` rice ... `)
                return item.buy(msg);
            }
        }

        return msg.channel.send("", {embed: msg.client.store.storeEmbed.setColor(msg.guild.me.displayColor)});
    }
}