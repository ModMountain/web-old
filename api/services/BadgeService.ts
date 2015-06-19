/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

var BADGES = [];
BADGES[Badge.Type.ALPHA] = {
  name: "Alpha Tester",
  description: "Unlocked by registering for Mod Mountain during its Alpha period.",
  unlocked: false,
  image: 'alpha.png'
};
BADGES[Badge.Type.BETA] = {
  name: "Beta Tester",
  description: "Unlocked by registering for Mod Mountain during its Beta period.",
  unlocked: true,
  image: 'beta.png'
};
var DEFAULT_BADGES = [BADGES[Badge.Type.BETA]];

var Service = {
  BADGES: BADGES,
  DEFAULT_BADGES: DEFAULT_BADGES
};

module.exports = Service;
