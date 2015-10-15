/// <reference path='../../typings/node/node.d.ts' />

/**
 * Production environment settings
 *
 * This file can include shared settings for a production environment,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */

var FS = require('fs');

module.exports = {

	port: 4337,
	host: '127.0.0.1',

	ssl: {
		cert: FS.readFileSync('/usr/local/nginx/ssl/modmountain/bundle.pem'),
		key: FS.readFileSync('/usr/local/nginx/ssl/modmountain/modmountain.key')
	},

	grunt: {
		_hookTimeout: 1000 * 60 * 2 // 2 minutes for Grunt to do all of its Grunt stuff
	},

	log: {
		level: 'verbose'
	},

	connections: {
		mongodb: {
			adapter: 'sails-mongo',
			url: 'mongodb://localhost:27017/modmountain_production'
		}
	},

	session: {
		secret: '***REMOVED***',
		cookie: {
			maxAge: 24 * 60 * 60 * 1000 * 30
		}
	},

	models: {
		connection: 'mongodb',
		migrate: 'safe'
	},

	http: {
		middleware: {
			order: [
				'favicon',
				'cookieParser',
				'session',
				'passportInit',
				'passportSession',
				'userToTemplate',
				'multer',
				'morgan',
				'router',
				'404',
				'500'
			],
		}
	},

	auth: {
		steam: {
			returnURL: "https://modmountain.com/auth/steamCallback",
			realm: 'https://modmountain.com/',
			apiKey: '***REMOVED***'
		}
	},

	stripe: {
		secretKey: '***REMOVED***',
		publicKey: '***REMOVED***',
		clientId: '***REMOVED***'
	},

	paypal: {
		clientId: '***REMOVED***',
		secret: '***REMOVED***',
		urlRoot: 'https://modmountain.com'
	},

	slack: {
		communityName: 'modmountain',
		token: '***REMOVED***'
	},

	analytics: true
};
