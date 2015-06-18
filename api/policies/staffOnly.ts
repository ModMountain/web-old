/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

module.exports = function (req, res, next) {
	if (req.user.permissionLevel >= 1) {
    next();
  } else {
    req.flash('error', 'You do not have permission to do this.');
    res.redirect('/');
  }
};
