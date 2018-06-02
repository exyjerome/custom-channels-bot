const chalk = require('chalk');
const format = require('string-format');

format.extend(String.prototype);

class Log {
	constructor ()
	{
		this.log(this.time(), chalk.blue('Starting...'));
	}

	log ()
	{
		console.log((Array.from(arguments)).join(' '));
	}

	type ()
	{

	}

	time ()
	{
		return chalk.keyword('orange')('[' + new Date().toLocaleString() + ']');
	}
	
	message (msg)
	{
		let templ = `{time} {channel} {author}: {message}`;
		let vars  = {
			time: this.time(),
			channel: chalk.green('[#' + msg.channel.name +']'),
			author: msg.author.username,
			message: msg.content
		};

		this.log(templ.format(vars));
	}

	command (command, msg)
	{
		let templ = `{time} {status} {command} {user}`;

		let tick = chalk.green('[✓]');
		let cross = chalk.red('[✘]');

		let vars = {
			time: this.time(),
			command: command.command,
			user: msg.author.username,
			status: command.isAllowed(msg.author.id) ? tick : cross
		};

		this.log (templ.format(vars));
	}

	info (text)
	{
		this.log(this.time(), chalk.blue(text));
	}
}

module.exports = new Log;