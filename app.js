const Discord   = require("discord.js");
const client    = new Discord.Client();
const token     = process.env.TOKEN || false;
const commands  = require('./commands.js');
const sentiment = require('sentiment');
const log       = require('./log.js');
const store     = require('data-store')('discord');
const cfg       = require('data-store')('cfg');
const emoji     = require('data-store')('emoji');
const ALL       = '*';
const ADMINS    = ['249292070475268096', '274966625310998528', '285110513678024704'];

commands.setLogger(log);

commands
    .register('$channel create {string} {strplus}', (type, name, msg) => {
        let category;

        if (cfg.has('category')) {
        	category = cfg.get('category');
        }

        if (msg.channel.parent.id !== category) {
        	msg.react('👌');
        	return msg.reply('Unable to create channels here!');
        }

        let types = ['public', 'private'];
            type  = type.toLowerCase();

        if (store.has(msg.author.id)) {
            return msg.reply('You already have an existing channel');
        }

        if (types.includes(type)) {
            if (type == 'public') {
                msg.guild
                    .createChannel(name, 'voice', [{
                        allow: ['MANAGE_CHANNELS', 'MANAGE_ROLES'],
                        id: msg.author.id
                    }])
                    .then((channel) => {
                        channel.setParent(category)
                        msg.member.setVoiceChannel(channel);
                        store.set(msg.author.id, channel.id);
                        msg.react('👌');
                    })
                ;
            } else if (type == 'private') {
                let everyone = msg.guild.roles.find("name", "@everyone");
                msg.guild
                    .createChannel(name, 'voice', [{
                        allow: ['CONNECT', 'SEND_MESSAGES'],
                        id: msg.author.id
                    }, {
                        deny: ['CONNECT'],
                        id: everyone.id
                    }])
                    .then((channel) => {
                        channel.setParent(category)
                        msg.member.setVoiceChannel(channel);
                        store.set(msg.author.id, channel.id);
                        msg.react('👌');
                    });
            }


        } else {
            return msg.reply('Channel must either be `public` or `private`');
        }
    })
    .allow(ALL);

commands
    .register('$channel delete', (msg) => {
        if (store.has(msg.author.id)) {
            let cid = store.get(msg.author.id);
            let channel = client.channels.find('id', cid);
            if (channel) {
                channel.delete();
            }
            store.del(msg.author.id);
            msg.react('👌');
        } else {
            msg.react('👌');
            return msg.reply('You don\'t have an active channel');
        }
    })
    .allow(ALL);

commands
    .register('$channel {string} {user}', (type, user, msg) => {
        if (store.has(msg.author.id)) {
            let usr = msg.guild.members.find('id', user);
            let chan = msg.guild.channels.find('id', store.get(msg.author.id));
            if (usr && chan) {
                chan.overwritePermissions(usr.id, {
                    CONNECT: type == 'add'
                });
                msg.react('👌');
            }
        } else {
            return msg.reply('You don\'t have an active channel');
        }

    })
    .allow(ALL);

commands
    .register('$channel purge', (msg) => {
        Object.keys(store.data).forEach((key) => {
            let channel = msg.guild.channels.find('id', store.data[key]);
            if (channel) {
            	if (channel.members.array().length == 0) {
	                channel.delete('Channel empty');
	            }
            } else {
            	store.del(key);
            }
        });
    })
    .allow(ADMINS);

commands
	.register('$regex', (msg) => {
		msg.reply("```\n" + (commands.commands.map(c => c.regex)).join("\n") + '```');
	})
	.allow(ADMINS);

commands
	.register('$channel help', (msg) => {
		msg.channel.send(`
Create a new public channel with the command \`$channel create public Channel Name\`
Create a new private channel with the command \`$channel create private Channel Name\`

If you've created a private channel, you can allow people to join with \`$channel add @username\`
Removing them is as simple as \`$channel remove @username\`
`)
	})
	.allow(ALL);

commands
	.register('$channel category {int}', (category, msg) => {
		cfg.set('category', category);
		msg.react('👌');
	})
	.allow(ADMINS);

commands.register('$abc', (m) => {
    m.reply(JSON.stringify(emoji.data));
}).allow(ALL);

commands.on('message', (msg) => {
    log.message(msg);
});



commands.attach(client);

client.login(token);

