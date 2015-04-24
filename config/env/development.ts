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

    /***************************************************************************
     * Set the default database connection for models in the development       *
     * environment (see config/connections.js and config/models.js )           *
     ***************************************************************************/

    connections: {
        mongodb: {
            adapter: 'sails-mongo',
            host: 'ds037617.mongolab.com',
            port: 37617,
            user: 'modmtn',
            password: 'modmtn',
            database: 'modmtn_development'
        }
    },

    gridFs: 'mongodb://modmtn:modmtn@ds037617.mongolab.com:37617/modmtn_development',

    auth: {
        steam: {
            returnURL: "http://modmtn.com:1337/auth/steamCallback",
            realm: 'http://modmtn.com:1337/',
            apiKey: '***REMOVED***'
        }
    },

    http: {
        middleware: {
            order: [
                'cookieParser',
                'session',
                'passportInit',
                'passportSession',
                'userToTemplate',
                'myRequestLogger',
                'bodyParser',
                'handleBodyParserError',
                'morgan',
                'router',
                'www',
                'favicon',
                '404',
                '500'
            ],
        }
    }
};
