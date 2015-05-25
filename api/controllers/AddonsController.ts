/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/stripe/stripe-node.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />

var Promise = require('bluebird');
var Stripe = require("stripe")("***REMOVED***");

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
        }).populateAll(), function (totalAddons, addons) {
            res.view({
                title: "Addons",
                activeTab: 'addons',
                totalAddons: totalAddons,
                addons: totalAddons,
                breadcrumbs: true
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
                        breadcrumbs: [['/addons', "Addons"]],
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
    },

    purchasePOST: function (req, res) {
        console.log('Got purchase POST');
        if (req.user === undefined) {
            req.socket.emit('notification', {type: 'error', msg: 'You must be logged in to make purchases.'})
        } else {
            var addonId:String = req.param('addonId');
            Addon.findOne(addonId).populateAll()
                .then(function (addon) {
                    if (addon === undefined) return res.send(404);
                    else {
                        var chargeAmount:Number;
                        var description:String;

                        // Free addons are set to a $5 donation
                        if (addon.price === 0) {
                            chargeAmount = 500;
                            description = "Donation to '" + addon.name + "'";
                        } else {
                            chargeAmount = addon.price * 100;
                            description = "Purchase '" + addon.name + "'";
                        }

                        var charge = Stripe.charges.create({
                            amount: chargeAmount, // amount in cents, again
                            currency: "usd",
                            source: req.param('tokenId'),
                            description: description
                        }, function (err, charge) {
                            if (err && err.type === 'StripeCardError') {
                                req.socket.emit('notification', {type: 'error', msg: "Your card was declined."})
                            } else {
                                Transaction.create({
                                    sender: req.user,
                                    receiver: addon.author,
                                    senderType: 'purchase',
                                    receiverType: 'sale',
                                    addon: addon,
                                    rawData: charge
                                }).then(function (transaction) {
                                    req.user.sentTransactions.add(transaction);
                                    addon.author.receivedTransactions.add(transaction);
                                    // If the user bought a paid addon we need to track the purchase
                                    if (addon.price > 0) {
                                        req.user.purchases.add(addon);
                                        addon.purchasers.add(req.user);
                                    }
                                    return [req.user.save(), addon.author.save()]
                                }).spread(function () {
                                    if (addon.price === 0) req.socket.emit('notification', {
                                        type: 'success',
                                        msg: "Donation successful!"
                                    });
                                    else req.socket.emit('notification', {
                                        type: 'success',
                                        msg: "Purchase successful!"
                                    });
                                });
                            }
                        });
                    }
                });
        }
    }
};

