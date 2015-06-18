/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

module.exports = function (req, res, next) {
  // God dammit I hate this language
  // https://stackoverflow.com/questions/3390396/how-to-check-for-undefined-in-javascript
  if ((typeof req.user !== 'undefined' && req.user !== null) && (typeof req.user.email === 'undefined' || req.user.email === null)) {
    req.flash('warning', "<a href='/profile/settings'>Please enter your email on your settings page. We need it to send you notifications.</a>");
  }
  next();
};
