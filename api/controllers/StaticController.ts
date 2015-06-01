/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: false
    },

    home: function (req, res) {
        Promise.join(
            Tag.find({totalAddons: {'>': 0}}).sort({totalAddons: 'desc'}).limit(3),
            Addon.find({status: Addon.Status.PUBLISHED, featured: true}).limit(4),
            Addon.find({status: Addon.Status.PUBLISHED}).sort({createdAt: 'asc'}).limit(10)
            , function (popularTags, featuredAddons, latestAddons) {

		        featuredAddons.forEach(function(addon) {
			        addon.coupons = undefined;
		        });
		        latestAddons.forEach(function(addon) {
			        addon.coupons = undefined;
		        });

                res.view({
                    title: 'Mod Mountain',
                    activeTab: 'home',
                    popularTags: popularTags,
                    featuredAddons: featuredAddons,
                    latestAddons: latestAddons
                });
            });
    }
};

