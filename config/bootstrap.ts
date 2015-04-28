/// <reference path='../typings/node/node.d.ts' />

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

var setupPassport = function () {
    var Passport = require('passport');
    var SteamStrategy = require('passport-steam').Strategy;

    // Serialization related functions
    Passport.serializeUser(function (user, done) {
        done(null, user.id)
    });
    Passport.deserializeUser(function (id, done) {
        User.findOne(id, function (err, user) {
            done(err, user)
        });
    });

    // Steam 3rd party sign in strategy
    Passport.use(new SteamStrategy(sails.config.auth.steam, function (identifier, profile, done) {
        User.findOrCreate({steamIdentifier: profile.id}, {
            username: profile.displayName,
            steamIdentifier: profile.id,
            steamProfile: profile
        }).then(function (user) {
            done(null, user)
        }).catch(function (err) {
            done(err)
        });
    }));
};

var setGlobals = function() {
    var Sails = require('sails');

    if (sails.config.environment === 'production') {
        sails.hooks.http.app.locals.assetPrefix = '//modmountain-assets.jessesavary.netdna-cdn.com'
    } else {
        sails.hooks.http.app.locals.assetPrefix = ''
    }
};

module.exports.bootstrap = function (cb) {
    setupPassport();
    setGlobals();

    // It's very important to trigger this callback method when you are finished
    // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)
    cb();
};
