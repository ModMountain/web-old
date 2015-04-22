/// <reference path='../../typings/node/node.d.ts' />
/**
 * StaticController
 *
 * @description :: Server-side logic for managing Statics
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var Passport = require('passport');
module.exports = {
    _config: {
        actions: true,
        shortcuts: false,
        rest: false
    },
    login: function (req, res) {
        if (req.user)
            res.redirect('/profile');
        else
            res.view();
    },
    steamSignIn: function (req, res, next) {
        Passport.authenticate('steam')(req, res, next);
    },
    steamCallback: function (req, res, next) {
        Passport.authenticate('steam', { successRedirect: '/profile', failureRedirect: '/auth/login' })(req, res, next);
    }
};
//# sourceMappingURL=AuthController.js.map