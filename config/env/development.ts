/// <reference path='../../typings/node/node.d.ts' />

/**
 * Development environment settings
 *
 * This file can include shared settings for a development team,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */

module.exports = {

    port: 1337,

    log: {
        level: 'silly'
    },

    connections: {
        mongodb: {
            adapter: 'sails-mongo',
            url: 'mongodb://localhost:27017/modmountain_development'
        },
      disk: {
        adapter: 'sails-disk'
      }
    },

    session: {
        secret: '***REMOVED***',
        cookie: {
            maxAge: 24 * 60 * 60 * 1000
        }
    },

    models: {
        connection: 'disk',
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
                'static',
                '404',
                '500',
            ],
        }
    },
    
    auth: {
        steam: {
            returnURL: "http://modmtn.jessesavary.com:1337/auth/steamCallback",
            realm: 'http://modmtn.jessesavary.com:1337/',
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
		urlRoot: 'http://modmtn.jessesavary.com:1337'
	},

	slack: {
		communityName: 'modmountain',
		token: '***REMOVED***'
	},

	analytics: false
};
