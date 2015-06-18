/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

module.exports = function (req, res, next) {
	if (req.isSocket) {
    next();
  } else {
    req.flash('error', 'Only sockets may use this route.');
    res.forbidden();
  }
};
