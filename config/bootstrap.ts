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
        PrettyError(error, '[Bluebird]Unhandled rejection:', function() {
            console.error('From promise:', promise)
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
        User.findOne(id, function (err, user) {
            if (user === undefined) user = null;
            done(err, user)
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
        }).spread(function(user) {
	        done(null, user)
        }).catch(function (err) {
            done(err)
        });
    }));
};

var setupGridFS = function (cb) {
    var Mongo = require('mongodb');
    var Grid = require('gridfs-stream');

    Mongo.connect(sails.config.connections.mongodb.url, function (err, db) {
        if (err) {
            return console.error(err);
        }
        sails.hooks.gfs = Grid(db, Mongo);
        cb();
    });
};

module.exports.bootstrap = function (cb) {
    setGlobals();

    setupPassport();
    setupGridFS(cb);
};
