/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

var NewRelic = require('newrelic');

module.exports = {
	_config: {
		actions: false,
		shortcuts: false,
		rest: false
	},

	home: function (req, res) {
		NewRelic.setControllerName('StaticController.home');
		Promise.join(
			Addon.find({status: Addon.Status.PUBLISHED, featured: true}).limit(4),
			Addon.find({status: Addon.Status.PUBLISHED}).sort({createdAt: 'asc'}).limit(10)
			, function (featuredAddons, latestAddons) {

				featuredAddons.forEach(function (addon) {
					addon.coupons = undefined;
				});
				latestAddons.forEach(function (addon) {
					addon.coupons = undefined;
				});

				res.view({
					title: 'Mod Mountain',
					activeTab: 'home',
					featuredAddons: featuredAddons,
					latestAddons: latestAddons
				});
			});
	},

	privacyPolicy: function (req, res) {
		NewRelic.setControllerName('StaticController.privacyPolicy');
		res.view({
			title: 'Privacy Policy',
			activeTab: 'extra',
			breadcrumbs: []
		});
	},

	termsOfService: function (req, res) {
		NewRelic.setControllerName('StaticController.termsOfService');
		res.view({
			title: 'Terms of Service',
			activeTab: 'extra',
			breadcrumbs: []
		});
	},

	codeOfConduct: function (req, res) {
		NewRelic.setControllerName('StaticController.codeOfConduct');
		res.view({
			title: 'Code of Conduct',
			activeTab: 'extra',
			breadcrumbs: []
		});
	}
};