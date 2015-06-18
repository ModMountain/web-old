/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

module.exports = function (req, res, next) {
  User.findOne(req.user.id)
    .populateAll()
    .then(function (user) {
      res.locals.user = user;
      req.user = user;
      next();
    })
    .catch(function (err) {
      next(err);
    });
};
