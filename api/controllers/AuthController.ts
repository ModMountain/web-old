/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />

var Passport = require('passport');
var NewRelic = require('newrelic');

module.exports = {
    _config: {
        actions: true,
        shortcuts: false,
        rest: false
    },

    login: function(req, res) {
	    NewRelic.setControllerName('AuthController.login');
        if (req.user) res.redirect('/profile');
        else res.redirect('/auth/steamSignIn');
    },

    logout: function(req, res) {
	    NewRelic.setControllerName('AuthController.logout');
        req.logout();
        res.redirect('/');
    },

    steamSignIn: function(req, res, next) {
	    NewRelic.setControllerName('AuthController.steamSignIn');
        Passport.authenticate('steam')(req, res, next);
    },

    steamCallback: function(req, res, next) {
	    NewRelic.setControllerName('AuthController.steamCallback');
        Passport.authenticate('steam', {successRedirect: '/profile', failureRedirect: '/auth/login'})(req, res, next);
    }
};

