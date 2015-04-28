/// <reference path='../../typings/node/node.d.ts' />

module.exports = function(req, res, next) {
    if ((typeof req.user !== 'undefined' && req.user !== null) && (typeof req.user.email === 'undefined' || req.user.email === null)) {
        req.flash('warning', "<a href='/profile/settings'>Please enter your email on your settings page. We need it to send you notifications.</a>");
    }
    next();
};