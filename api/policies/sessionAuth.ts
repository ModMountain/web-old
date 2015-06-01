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
  if (req.isSocket) {
    if (req.session.passport.user !== undefined) return next();
    else return req.socket.emit('notification', {type: 'error', message: "You must be logged in to do that!"});
  } else {
    if (req.user !== undefined) return next();
    else {
	  res.status(401);
      req.flash('error', "You must be logged in to do that!");
      res.redirect('/auth/login')
    }
  }
};
