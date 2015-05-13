/// <reference path='../../typings/node/node.d.ts' />

module.exports = function (req, res, next) {
    User.findOne(req.user.id)
        .populateAll()
        .then(function (user) {
            res.locals.user = user;
            next();
        })
        .catch(function(err) {
            next(err);
        });
};