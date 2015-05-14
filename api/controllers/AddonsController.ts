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
                PrettyError(err, 'Error occured during Addon.find().paginate() inside AddonsController.index');
                req.flash('error', "An error occurred. Please try again.");
                res.redirect('/');
            });
    },

    download: function (req, res) {
        var addonId = req.param('id');
        Addon.findOne(addonId)
            .then(function (addon) {
                if (addon !== undefined) {
                    if (addon.canDownload(req.user)) {
                        sails.hooks.gfs.exist({_id: addon.zipFile}, function(err, found) {
                            if (err) {
                                PrettyError(err, 'An error occurred during sails.hooks.gfs.exist inside AddonsController.download');
                                req.flash('error', "Something went wrong while downloading addon '" + addon.name + "'");
                                res.redirect('/addons/view/' + addon.id);
                            } else if (found) {
                                var filename =  addon.name + '.zip';
                                res.setHeader('Content-disposition', 'attachment; filename=' + filename);
                                sails.hooks.gfs.createReadStream({_id: addon.zipFile, chunkSize: 1024 * 1024}).pipe(res);
                            } else {
                                req.flash('error', "Addon '" + addon.name + "' is still uploading.");
                                res.redirect('/addons/view/' + addon.id);
                            }
                        });
                    } else {
                        res.send(403)
                    }
                } else {
                    res.send(404);
                }
            }).catch(function (err) {
                PrettyError(err, 'Error occurred during Addon.findOne inside AddonsController.download');
                res.send(500);
            });
    }
};

