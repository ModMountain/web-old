/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

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
