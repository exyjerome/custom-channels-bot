const EventEmitter = require('events');
const log = require('./log.js');

String.prototype.matches = function (regex) {
	let match = this.match(regex);
	if (match === null) return false;

	return match.slice(0, match.length);
};

if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

class Command {
	constructor (command, callback)
	{
		this.regex = this.getRegex(command);
		this.command = command;
		this.callback = callback;
		this.allowed = [];
	}
	getRegexForType (type)
	{
		switch (type) {
			case '{string}':
				return '([a-zA-Z]+)';
			case '{strplus}':
				return '([a-zA-Z ].*)';
			case '{int}':
				return '([0-9]+)';
			case '{url}':
				return '(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,}).*';
			case '{user}':
				return '(?:<@(?:(\!)?))([0-9]{0,18})(?:>)';
			case '{group}':
				return '(?:<@&)([0-9]{0,18})(?:>)';
		}
	}
	getRegex (command)
	{
		let struct = command.matches(/(?:^\$)(\w+)/);
		let args   = command.matches(/(\{\w+\})/g);
		let regex  = command;

		if (args) {
			args.forEach((arg) => {
				let reg = this.getRegexForType(arg);
				regex = regex.replace(arg, reg)
			});
		}

		return regex.replace(/\$/, '\\$');
	}
	allow (user)
	{
		if (typeof user == 'object') {
			let self = this;
			user.forEach((id) => {
				if (!self.allowed.includes(id))
					self.allowed.push(id);
			});
		} else {
			this.allowed.push(user);
		}
	}
	isAllowed (user)
	{
		return this.allowed.includes(user) || this.allowed.includes('*');
	}
}

class Commands extends EventEmitter {
	constructor ()
	{
		super();
		this.commands = [];
	}

	setLogger(logger)
	{
		this.logger = logger;
	}

	attach (client)
	{
		let self = this;
		client.on('message', (message) => {
			if (message.author.username != client.user.username) {
				self.handleIncoming(message);
				this.emit('message', message);
			}
		});
		client.on('ready', () => {
			self.logger.info(`Logged in as ${client.user.tag}!`)
			this.emit('ready');
		});
	}
	handleIncoming (message)
	{
		let content = message.content;

		this.commands.forEach((command) => {
			let matches = content.match(command.regex);
			if (matches != null) {
				let args = matches.slice(1, matches.length) || [];
					args.push(message);

				log.command(command, message);
				if (command.isAllowed(message.author.id)) {
					return command.callback.apply(null, args);
				}
			}
		});
	}

	register (command, callback)
	{
		this.commands.push(new Command(command, callback));

		return this.commands[this.commands.length-1];
	}
}

module.exports = new Commands;
