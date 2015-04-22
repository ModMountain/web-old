/// <reference path='../../typings/node/node.d.ts' />

/**
 * StaticController
 *
 * @description :: Server-side logic for managing Statics
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
    _config: {
        actions: true,
        shortcuts: false,
        rest: false
    },

    index: function (req, res) {
        Addon.find().paginate({page: 0, limit: 5})
            .then(function (addons) {
                res.view({title: "Addons", activeTab: 'addons', breadcrumbs: [['/addons', "Addons"]], addons: addons});
            }).catch(function (err) {
                console.error("Error occured during Addon.find().paginate() inside AddonsController.index:", err);
                req.flash('error', "An error occurred. Please try again.");
                res.redirect('/');
            });
    }
};

