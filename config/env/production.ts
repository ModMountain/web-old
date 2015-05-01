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

    port: 4337,

    log: {
        level: 'info'
    },

    connections: {
        mongodb: {
            adapter: 'sails-mongo',
            url: 'mongodb://localhost:27017/modmountain_production'
        },
        localDiskDb: {
            adapter: 'sails-disk'
        }
    },

    session: {
        adapter: 'redis',
        secret: '***REMOVED***',
        cookie: {
            maxAge: 24 * 60 * 60 * 1000 * 30
        }
    },

    models: {
        connection: 'localDiskDb',
        migrate: 'alter'
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
                'www',
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
    }
};
