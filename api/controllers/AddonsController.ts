/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />
/// <reference path='../../typings/stripe/stripe-node.d.ts' />

var Stripe = require("stripe")("***REMOVED***");

module.exports = {
	_config: {
		actions: false,
		shortcuts: false,
		rest: false
	},

	index: function (req, res) {
		Promise.join(Addon.count({status: Addon.Status.PUBLISHED}), Addon.find({status: Addon.Status.PUBLISHED}).paginate({
			page: 0,
			limit: 10
		}).populateAll(), function (totalAddons, addons) {
			res.view({
				title: "Addons",
				activeTab: 'addons',
				totalAddons: totalAddons,
				addons: addons,
				breadcrumbs: true
			});
		}).catch(function (err) {
			PrettyError(err, 'Error occured during Addon.find().paginate() inside AddonsController.index');
			res.redirect('/');
		});
	},

	viewAddon: function (req, res) {
		var addonId:String = req.param('id');
		Addon.findOne(addonId).populateAll()
			.then(function (addon:Addon) {
				if (addon === undefined) res.send(404);
				else if (addon.status !== Addon.Status.PUBLISHED) {
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
		var addonId:String = req.param('id');
		Addon.findOne(addonId).populateAll()
			.then(function (addon:Addon) {
				if (addon === undefined) res.send(404);
				else if (!addon.canDownload(req.user)) res.send(403);
				else {
					sails.hooks.gfs.exist({_id: addon.zipFile}, function (err, found:boolean) {
						if (err) {
							PrettyError(err, 'An error occurred during sails.hooks.gfs.exist inside AddonsController.download');
							req.flash('error', "Something went wrong while downloading addon '" + addon.name + "'");
							res.redirect('/addons/view/' + addon.id);
						} else if (found) {
							var filename:String = addon.name + '.zip';
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
				}
			}).catch(function (err) {
				PrettyError(err, 'Error occurred during Addon.findOne inside AddonsController.download');
				res.send(500);
			});
	},

	stripeCheckout: function (req, res) {
		if (req.user === undefined) {
			req.socket.emit('notification', {type: 'error', msg: 'You must be logged in to make purchases.'})
		} else {
			var addonId:String = req.param('addonId');
			Addon.findOne(addonId).populateAll()
				.then(function (addon:Addon) {
					if (addon === undefined) return res.notFound();
					else if (addon.canDownload(req.user)) {
						return req.socket.emit('notification', {
							type: 'error',
							msg: "You have already purchased this addon."
						})
					} else {
						var tokenId = req.param('tokenId');
						var finalBill = req.param('finalBill');
						var coupon = req.param('coupon');
						var description = req.param('description');
						var amountToCharge = addon.price * 100;

						// A coupon is being used in this transaction
						if (coupon !== undefined && coupon !== null) {
							coupon = addon.getCoupon(coupon.code);
							if (coupon === undefined || coupon === null || coupon.expired) {
								req.user.status = User.Status.SUSPENDED;
								req.user.save()
									.then(function () {
										req.flash('error', "Fraudulent coupon detected, your account has been suspended. Please contact support for more information.");
										res.redirect('/contact');
									})
							} else {
								if (coupon.type === 0) amountToCharge = addon.price * (1.0 - coupon.amount / 100) * 100;
								else amountToCharge = (addon.price - coupon.amount) * 100;
								if (amountToCharge < 0) amountToCharge = 0;
							}
						}

						// Uh-oh, someone is trying to commit fraud!
						if (amountToCharge !== finalBill) {
							req.user.status = User.Status.SUSPENDED;
							req.user.save()
								.then(function () {
									req.flash('error', "Fraudulent transaction detected, your account has been suspended. Please contact support for more information.");
									res.redirect('/contact');
								})
						} else {
							Stripe.charges.create({
								amount: amountToCharge,
								currency: 'usD',
								source: tokenId,
								description: description
							}, function (err, charge) {
								if (err) {
									if (err.type === 'StripeCardError') req.socket.emit('notification', {
										type: 'error',
										msg: "Your card was declined."
									});
									else {
										PrettyError(err, "Something went wrong while processing a Stripe transaction");
										req.socket.emit('notification', {type: 'error', msg: "Something went wrong."})
									}
								} else {
									// Lazy increment, no need to wait for user feedback or anything
									addon.incrementCoupon(coupon.code);

									// Persist this transaction to the database
									Transaction.create({
										sender: req.user,
										receiver: addon.author,
										senderType: 'purchase',
										receiverType: 'sale',
										addon: addon,
										rawData: charge
									}).catch(function (error) {
										PrettyError(error, "Something went wrong while calling Transaction.create inside AddonsController.purchasePOST:")
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
										if (addon.price === 0) {
											NotificationService.sendUserNotification(addon.author, "MEDIUM", req.user.username + " donated $" + amountToCharge / 100 + " USD to your addon, '" + addon.name);
											req.socket.emit('notification', {
												type: 'success',
												msg: "Donation successful!"
											});
										}
										else {
											NotificationService.sendUserNotification(addon.author, "MEDIUM", req.user.username + " purchased your addon, '" + addon.name + "' for $" + amountToCharge / 100);
											req.socket.emit('notification', {
												type: 'success',
												msg: "Purchase successful!"
											});
										}
									}).catch(function (error) {
										PrettyError(error, "Something went wrong while saving transactions to users inside AddonsController.purchasePOST:")
									})
								}
							});
						}
					}
				});
		}
	},

	validateCoupon: function (req, res) {
		if (!req.isSocket) {
			req.flash('error', 'Only sockets may validate coupons');
			res.redirect('/')
		}

		var addonId = req.param('id');
		var couponCode = req.param('couponCode');

		// We don't need to do a full populate because coupons are stored directly on the addon
		Addon.findOne(addonId)
			.then(function (addon:Addon) {
				if (addon === undefined) {
					req.socket.emit('notification', {
						type: 'error',
						msg: 'That addon does not exist'
					});
				} else {
					req.socket.emit('couponValidated', addon.getCoupon(couponCode));
				}
			}).catch(function (err) {
				PrettyError(err, "Something went wrong during Addon.findOne inside AddonsController.validateCoupon:")
			});
	}
};