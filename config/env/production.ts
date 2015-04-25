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

module.exports = {

    log: {
        level: 'info'
    },

    port: '4337',

    connections: {
        mongodb: {
            adapter: 'sails-mongo',
            host: 'localhost',
            port: 27017,
            database: 'modmountain_production'
        }
    },

    gridFs: 'mongodb://localhoust:27017/modmountain_production',

    auth: {
        steam: {
            returnURL: "https://modmountain.com/auth/steamCallback",
            realm: 'https://modmountain.com/',
            apiKey: '***REMOVED***'
        }
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
                'bodyParser',
                'handleBodyParserError',
                'morgan',
                'router',
                '404',
                '500'
            ],
        }
    }
};
