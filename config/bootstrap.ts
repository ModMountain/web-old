/// <reference path='../typings/node/node.d.ts' />
/// <reference path='../typings/modmountain/modmountain.d.ts' />
/// <reference path='../typings/bluebird/bluebird.d.ts' />

/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#/documentation/reference/sails.config/sails.config.bootstrap.html
 */

var setGlobals = function () {
  var Promise = require('bluebird');
  Promise.longStackTraces();
  global.Promise = Promise;

  var Mapstrace = require('mapstrace');
  Promise.promisifyAll(Mapstrace);
  global.PrettyError = function (err, msg, cb) {
    return Mapstrace.build(err, true, function (result) {
      console.error(msg);
      console.error(err.toString() + ':\n' + Mapstrace.stringify(result));
      if (cb) cb();
    })
  };
  process.on("unhandledRejection", function (error, promise) {
    PrettyError(error, '[Bluebird]Unhandled rejection:', function () {
      console.error('From promise:', promise)
    });
  });
  process.on("uncaughtException", function (error) {
    PrettyError(error, 'An uncaught exception has caused Node.js to crash!', function () {
      process.exit(1);
    });
  });

    if (sails.config.environment === 'production') {
        sails.hooks.http.app.locals.assetPrefix = '/assets'
    } else {
        sails.hooks.http.app.locals.assetPrefix = '/assets'
    }
};

var setupPassport = function () {
  var Passport = require('passport');
  var SteamStrategy = require('passport-steam').Strategy;

  // Serialization related functions
  Passport.serializeUser(function (user, done) {
    done(null, user.id)
  });
  Passport.deserializeUser(function (id, done) {
    User.findOne(id).populate('notifications')
      .then(function (user:User) {
        if (user === undefined) user = null;
        done(null, user)
      }).catch(function (err) {
        done(err)
      });
  });

  // Steam 3rd party sign in strategy
  Passport.use(new SteamStrategy(sails.config.auth.steam, function (identifier, profile, done) {
    User.findOrCreate({steamIdentifier: profile.id}, {
      username: profile.displayName,
      steamIdentifier: profile.id,
      steamProfile: profile
    }).then(function (user:User) {
      // Check for undefined in case the user pressed the "Sync Steam Profile" button on their settings page
      if (user.steamProfile.provider === undefined) {
        user.steamProfile = profile;
        user.username = profile.displayName
      }
      return [user, user.save()];
    }).spread(function (user) {
      done(null, user)
    }).catch(function (err) {
      done(err)
    });
  }));
};

var setupGridFS = function () {
  var Mongo = require('mongodb');
  var Grid = require('gridfs-stream');
  Promise.promisifyAll(Mongo);

  return Mongo.connectAsync(sails.config.connections.mongodb.url)
    .then(function (db) {
      sails.hooks.gfs = Grid(db, Mongo);
    })
};

var updateDatabase = function () {
  return [
    User.update({badges: undefined}, {badges: BadgeService.DEFAULT_BADGES})
  ]
};

module.exports.bootstrap = function (cb) {
  setGlobals();
  setupPassport();

  setupGridFS()
    .then(updateDatabase)
    .spread(function() {
      cb()
    })
    .catch(function (err) {
      console.error("An error occurred during bootstrap");
      console.error(err);
    });
};
