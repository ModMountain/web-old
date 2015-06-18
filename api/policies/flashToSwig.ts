/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

module.exports = function (req, res, next) {
  res.locals.infoMessages = req.flash('info');
  res.locals.successMessages = req.flash('success');
  res.locals.errorMessages = req.flash('error');
  res.locals.warningMessages = req.flash('warning');
  return next();
};
