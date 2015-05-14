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
module.exports = function(req, res, next) {
  if (req.user.permissionLevel == 2) next();
  else {
    req.flash('error', 'You do not have permission to do this.');
    res.redirect('/');
  }
};
