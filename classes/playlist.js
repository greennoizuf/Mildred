const Discord = require("discord.js");
const auth = require("../resources/auth.json");
const Video = require("./video.js");


module.exports = class Playlist{

    constructor(guild){
        this.queue = new Array();
        this.paused = false;
        this.dontRelate = new Array();
        this.bitrate = 64;
    }

    addSong(song, first){
        let vid = new Video(song);
        if(!this.queue) this.queue = new Array();
        if(first)
            this.queue.splice(1, 0, vid);
        else
            this.queue.push(vid);
    }

    playNext(){
        this.textChannel.guild.client.sendStatus();
        this.paused = false;        
        if(this.queue.length == 0){
            this.updateMessage("Ran of out songs to play.");
            this.textChannel.guild.voiceConnection.disconnect();            
            this.textChannel.client.voiceConnections.forEach(conn => {
                let done = false;
                conn.channel.members.forEach(mem => {
                    if(!done && this.textChannel.guild.members.filter(m => !m.user.bot).get(mem.id)){
                        done = true;
                        setTimeout( () => {
                            if(conn.dispatcher){
                                conn.dispatcher.pause();
                                conn.dispatcher.resume();
                            }
                            //console.log("Pausing and resuming in " + conn.channel.guild.name);
                        },250);
                    }
                });
            });
            this.textChannel.guild.client.initPlaylist(this.textChannel.guild);
            return;
        }else if(this.textChannel.guild.voiceConnection && this.textChannel.guild.voiceConnection.channel.members.size == 1){
            this.textChannel.send("Looks like the voice channel is empty :c.  Pausing playback for now, you can resume it with `" + this.textChannel.guild.prefix + "resume`");
            this.paused = true;
            if(this.timeout)
                clearTimeout(this.timeout);
            this.timeout = setTimeout(() => {
                if(this.paused == true && this.textChannel.guild.voiceConnection && this.textChannel.guild.voiceConnection.channel.members.size == 1){
                    this.updateMessage("Voice Channel empty for 15 minutes");
                    this.textChannel.guild.voiceConnection.disconnect();                    
                    this.textChannel.client.voiceConnections.forEach(conn => {
                        let done = false;
                        conn.channel.members.forEach(mem => {
                            if(!done && this.textChannel.guild.members.filter(m => !m.user.bot).get(mem.id)){
                                done = true;
                                setTimeout( () => {
                                    if(conn.dispatcher){
                                        conn.dispatcher.pause();
                                        conn.dispatcher.resume();
                                    }
                                    //console.log("Pausing and resuming in " + conn.channel.guild.name);
                                },250);
                            }
                        });
                    });
                    this.textChannel.guild.client.initPlaylist(this.textChannel.guild);                    
                }
            },900000)
            return;
        }
        this.queue[0].validate().then( () => {
            this.updateMessage();
            this.Play();
        }).catch(err => {
            this.queue.splice(0,1);
            this.playNext();
        });
    }

    Play(){
        this.queue[0].getStream(this.bitrate).then( stream => {
            let thisSeeks = this.queue[0].seeks;
            let startSong = this.queue[0];
            
            if(!this.textChannel.guild.voiceConnection)
                return;
            var dispatcher = this.textChannel.guild.voiceConnection.playStream(
                stream,
                {volume: 0.5,
                bitrate: this.bitrate}
            );

            if(this.queue[0].duration > 0)
            {
                if(this.timeout)
                    clearTimeout(this.timeout);
                this.timeout = setTimeout(() => {
                    dispatcher.end();
                },(this.queue[0].duration*1000) - (25+this.queue[0].startTime));
            }
            
            dispatcher.on("end", reason => {
                if(reason == "dont" || this.queue.length == 0)
                    return;
                if(reason != "seek" && this.queue.length > 0){
                    this.queue[0].seeks = 0;
                    this.queue[0].startTime = 0;
                }
                this.ytdlStream = null;
                if(this.queue.length == 1 && this.auto) 
                    this.queue[0].getRelated(this.dontRelate).then(song => {
                        this.dontRelate.push(this.queue[0].title);
                        if(this.dontRelate.length > 5)
                            this.dontRelate.splice(0,1);
                        this.queue.push(new Video(song));
                        this.queue.splice(0,1);
                        this.playNext();
                    }).catch(err => {
                        if(err != "Not youtube") console.log(err);
                        this.queue.splice(0,1);
                        this.playNext();
                    });
                else{
                    this.queue.splice(0,1); //get rid of the lastsong                
                    this.playNext();
                }
            }).on('error',error => console.log("Dispatcher error in " + this.textChannel.guild.name + "\n" + error));
        }).catch(err => console.log(err));
    }

    updateMessage(reason){
        var embed = new Discord.RichEmbed();
        embed.setColor(this.textChannel.guild.me.displayColor);
        if(!this.textChannel.guild.channels.find(ch => ch.id == this.textChannel.id))
            this.textChannel = this.textChannel.guild.channels.filter(ch => ch.type == "text").first();
        if(!reason){
            if(this.paused)
                embed.setTitle(":pause_button: " + this.queue[0].title);
            else    
                embed.setTitle(":arrow_forward: " + this.queue[0].title);
            
            embed.addField("Duration", this.getDurationString(this.queue[0].duration), true);
            embed.addField("Songs Left", this.queue.length-1, true)
            embed.setImage(this.queue[0].image.replace("large", "t500x500"));
            if(this.queue[0].type == "youtube")
                embed.setURL("https://www.youtube.com/watch?v=" + this.queue[0].link);
            else   
                embed.setURL(this.queue[0].url);
        }else{
            embed.setTitle(":octagonal_sign: Music playback stopped");
            embed.addField("Reason", reason);
        }
        let playingmessage;
        if(!this.message)
            playingmessage = this.textChannel.send("", {embed}).then(m => this.message = m);
        else if(this.textChannel.lastMessageID != this.message.id && !this.paused){
            if(this.message.collector)
                this.message.collector.stop();
            this.message.delete().catch(err => err);
            playingmessage = this.textChannel.send("", {embed}).then(m => this.message = m);
        }else{
            playingmessage = this.message.edit("", {embed}).catch(err => this.textChannel.send("", {embed}).then(m => this.message = m));
            if(reason)
                playingmessage.then(m => m.clearReactions());
            return;
        }
        if(!this.textChannel.guild.me.hasPermission("MANAGE_MESSAGES") || !this.textChannel.guild.me.hasPermission("ADD_REACTIONS"))
            return; //dont do the message reactions if you dont have perms.
        if(reason)
            return playingmessage.then(m => m.clearReactions());
        
        playingmessage.then(message => {
            message.react("🛑").catch(err => (err))
            .then(stop => message.react("⏯").catch(err => (err))
            .then(playpause => message.react("⏭").catch(err => (err))
            .then(next => message.react("🔀").catch(err => (err))
            .then(shuffle => {
                if(message.collector && !message.collector.ended)
                    return;
                const filter = (r,user) => user.id != message.client.user.id && (r.emoji.name == stop.emoji.name || r.emoji.name == playpause.emoji.name || r.emoji.name == next.emoji.name || r.emoji.name == shuffle.emoji.name);
                message.collector = new Discord.ReactionCollector(message, filter);
                message.collector.on("collect", reaction => {
                    message.author = reaction.users.find(u => !u.bot);
                    message.member = message.guild.member(reaction.users.find(u => !u.bot));
                    reaction.remove(reaction.users.find(u => !u.bot)).then(() => {
                        if(reaction.emoji.name == stop.emoji.name)
                            message.client.commands.find(cmd => cmd.areYou("stop")).run({msg: message});
                        else if(reaction.emoji.name == next.emoji.name)
                            message.client.commands.find(cmd => cmd.areYou("skip")).run({msg: message});
                        else if(reaction.emoji.name == playpause.emoji.name)
                            message.client.commands.find(cmd => cmd.areYou("pause")).run({msg: message});
                        else if(reaction.emoji.name == shuffle.emoji.name)
                            message.client.commands.find(cmd => cmd.areYou("shuffle")).run({msg: message});
                    });
                });
            }))));
        })
    }

    sendQueueMessage(msg, song){
        var embed = new Discord.RichEmbed();
        embed.addField("Name", song.title);
        embed.setColor(msg.guild.me.displayColor);
        if(song.type == "spotify" && !song.image)
            embed.setThumbnail("http://www.stickpng.com/assets/images/59b5bb466dbe923c39853e00.png");
        else if(!song.tracks)
            embed.setThumbnail(song.image);
        
        if(song.tracks){
            embed.setTitle(":notes: Playlist/Album added to queue");
            embed.addField("Number of tracks", song.tracks);
        }else{
            embed.setTitle(":musical_note: Track added to queue");
            embed.addField("Duration", this.getDurationString(song.duration), true);
            embed.addField("Position", this.queue.indexOf(this.queue.find(s => s.title == song.title)), true);
        }
        if(this.qmessage)
            this.qmessage.edit("", {embed}).then(m => this.qmessage = null);
        else
            msg.channel.send("", {embed}).then(m => this.qmessage = null);
    }

    getDurationString(time){
        var date = new Date(null);
        date.setSeconds(time); // specify value for SECONDS here
        return date.toISOString().substr(11, 8);
    }
}