/// <reference path='../../typings/node/node.d.ts' />

/**
 * StaticController
 *
 * @description :: Server-side logic for managing Statics
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var Promise = require('bluebird')
module.exports = {
    _config: {
        actions: true,
        shortcuts: false,
        rest: false
    },

    index: function (req, res) {
        Promise.join(Addon.count({status: 'published'}), Addon.find({status: 'published'}).paginate({
            page: 0,
            limit: 10
        }).populateAll())
            .then(function (totalAddons, addons) {
                res.view({
                    title: "Addons",
                    activeTab: 'addons',
                    breadcrumbs: [['/addons', "Addons"]],
                    totalAddons: totalAddons[0],
                    addons: totalAddons[1],
                });
            }).catch(function (err) {
                PrettyError(err, 'Error occured during Addon.find().paginate() inside AddonsController.index');
                res.redirect('/');
            });
    },

    viewAddon: function (req, res) {
        var addonId = req.param('id');
        Addon.findOne(addonId).populateAll()
            .then(function (addon) {
                if (addon === undefined) res.send(404);
                else if (addon.status !== 'published') {
                    req.flash('error', "Addon '" + addon.name + "' is not published");
                    res.redirect('/addons')
                } else {
                    res.view({
                        title: addon.name,
                        activeTab: 'addons',
                        breadcrumbs: [['/addons', "Addons"], ['/addons/' + addonId, addon.name]],
                        addon: addon
                    })
                }
            });
    },

    download: function (req, res) {
        var addonId = req.param('id');
        Addon.findOne(addonId)
            .then(function (addon) {
                if (addon !== undefined) {
                    if (addon.canDownload(req.user)) {
                        sails.hooks.gfs.exist({_id: addon.zipFile}, function (err, found) {
                            if (err) {
                                PrettyError(err, 'An error occurred during sails.hooks.gfs.exist inside AddonsController.download');
                                req.flash('error', "Something went wrong while downloading addon '" + addon.name + "'");
                                res.redirect('/addons/view/' + addon.id);
                            } else if (found) {
                                var filename = addon.name + '.zip';
                                res.setHeader('Content-disposition', 'attachment; filename=' + filename);
                                sails.hooks.gfs.createReadStream({
                                    _id: addon.zipFile,
                                    chunkSize: 1024 * 1024
                                }).pipe(res);
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

