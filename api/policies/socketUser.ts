/// <reference path='../../typings/node/node.d.ts' />

/**
 * sessionAuth
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = function (req, res, next) {
    if (!req.isSocket || req.session.passport.user === undefined) return next();

    User.findOne(req.session.passport.user).populateAll()
        .then(function (user) {
            req.user = user;
            next();
        })
        .catch(function (err) {
            PrettyError(err, 'An error occurred during User.findOne inside the socketUser policy');
            next(err);
        });
};