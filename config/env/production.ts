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

  models: {
    connection: 'mongodb_production'
  },

  gridFs: 'mongodb://modmtn:modmtn@ds037617.mongolab.com:37617/modmtn_development',

  auth: {
    steam: {
      returnURL: "http://local.modmtn.com:1337/auth/steamCallback",
      realm: 'http://local.modmtn.com:1337/',
      apiKey: '***REMOVED***'
    }
  },

  http: {
    middleware: {
      order: [
        'startRequestTimer',
        'cookieParser',
        'session',
        'passportInit',
        'passportSession',
        'userToTemplate',
        'myRequestLogger',
        'bodyParser',
        'handleBodyParserError',
        'router',
        'www',
        'favicon',
        '404',
        '500'
      ],
    }
  }
};
