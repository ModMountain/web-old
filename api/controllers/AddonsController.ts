/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />
/// <reference path='../../typings/stripe/stripe-node.d.ts' />

var Stripe = require("stripe")(sails.config.stripe.secretKey);
var PayPal = require('paypal-rest-sdk');
PayPal.configure({
	mode: 'sandbox',
	//client_id: sails.config.paypal.clientId,
	client_id: sails.config.paypal.clientId,
	//client_secret: sails.config.paypal.secret,
	client_secret: sails.config.paypal.secret,
});
var Needle = require('needle');

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
		}).populate('author').populate('tags'), function (totalAddons, addons) {
			addons.forEach(function(addon) {
				addon.author = {
					id: addon.author.id,
					username: addon.author.username
				};
				addon.coupons = undefined;
			});

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
		Addon.findOne(addonId).populate('author').populate('reviews').populate('tags').populate('purchasers')
			.then(function (addon:Addon) {
				if (addon === undefined) res.send(404);
				else if (addon.status !== Addon.Status.PUBLISHED) {
					req.flash('error', "Addon '" + addon.name + "' is not published");
					res.redirect('/addons')
				} else {
					// Increment views count
					addon.views++;
					addon.save();

					addon.author = {
						id: addon.author.id,
						username: addon.author.username
					};
					addon.coupons = undefined;
					addon.purchasers = _.map(addon.purchasers, function(user) {
						return {id: user.id};
					});
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
		Addon.findOne(addonId).populate('purchasers')
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
							// Increment download count
							addon.downloads++;
							addon.save();

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

	artwork: function(req, res) {
		var addonId:string = req.param('id');
		var artwork:string = req.param('artwork');
		Addon.findOne(addonId)
			.then(function (addon:Addon) {
				if (addon === undefined) res.send(404);
				else if (addon.status !== Addon.Status.PUBLISHED) res.send(403);
				else if (addon.galleryImages.indexOf(artwork) === -1 && addon.bannerImage !== artwork && addon.thinCardImage !== artwork && addon.wideCardImage !== artwork) res.send(403);
				else {
					sails.hooks.gfs.exist({_id: artwork}, function (err, found:boolean) {
						if (err) {
							PrettyError(err, 'An error occurred during sails.hooks.gfs.exist inside AddonsController.download');
							res.send(500);
						} else if (found) {
							res.setHeader('Content-disposition', 'attachment;');
							sails.hooks.gfs.createReadStream({
								_id: artwork,
								chunkSize: 1024 * 1024
							}).pipe(res);
						} else {
							res.send(404);
						}
					});
				}
			}).catch(function (err) {
				PrettyError(err, 'Error occurred during Addon.findOne inside AddonsController.download');
				res.send(500);
			});
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
	},

	accountBalanceCheckout: function (req, res) {
		if (req.user === undefined) {
			req.socket.emit('notification', {type: 'error', msg: 'You must be logged in to make purchases.'})
		} else {
			var addonId:String = req.param('addonId');
			Addon.findOne(addonId).populate('author').populate('purchasers')
				.then(function (addon:Addon) {
					if (addon === undefined) return res.notFound();
					else if (addon.canDownload(req.user)) {
						return req.socket.emit('notification', {
							type: 'error',
							msg: "You have already purchased this addon."
						})
					} else {
						var finalBill = parseInt(req.param('finalBill'));
						var coupon = req.param('coupon');
						var amountToCharge = addon.price * 100;
						// If this addon is free, the user will pay whatever they want
						if (amountToCharge === 0) amountToCharge = finalBill;

						// A coupon is being used in this transaction
						if (coupon !== undefined && coupon !== null) {
							coupon = addon.getCoupon(coupon);
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
						} else coupon = {code: ''};

						// Uh-oh, someone is trying to commit fraud!
						if (amountToCharge !== finalBill) {
							req.user.status = User.Status.SUSPENDED;
							req.user.save()
								.then(function () {
									req.flash('error', "Fraudulent transaction detected, your account has been suspended. Please contact support for more information.");
									res.redirect('/contact');
								})
						} else {
							if (req.user.balance - amountToCharge < 0) {
								req.flash('error', "You do not have the required funds to cover the transaction.");
								res.redirect('/addons/' + addonId);
							} else {
								req.user.balance = req.user.balance - amountToCharge;
								req.user.save()
									.catch(function (err) {
										PrettyError(err, "Something went wrong while calling req.user.save() inside AddonsController.accountBalanceCheckout:")
									})
									.then(function () {
										return Transaction.create({
											sender: req.user,
											receiver: addon.author,
											senderType: 'purchase',
											receiverType: 'sale',
											addon: addon,
											amount: amountToCharge,
											coupon: coupon.code
										})
									}).catch(function (error) {
										PrettyError(error, "Something went wrong while calling Transaction.create inside AddonsController.accountBalanceCheckout:")
									}).then(function (transaction) {
										req.user.sentTransactions.add(transaction);
										addon.author.receivedTransactions.add(transaction);
										// If the user bought a paid addon we need to track the purchase
										if (addon.price > 0) {
											req.user.purchases.add(addon);
										}
										addon.author.balance += amountToCharge;
										return [addon.author.save(), req.user.save()]
									}).spread(function () {
										if (addon.price === 0) {
											NotificationService.sendUserNotification(addon.author, "MEDIUM", req.user.username + " donated $" + amountToCharge / 100 + " USD to your addon, '" + addon.name);
											req.flash('success', 'Donation success');
										} else {
											NotificationService.sendUserNotification(addon.author, "MEDIUM", req.user.username + " purchased your addon, '" + addon.name + "' for $" + amountToCharge / 100);
											req.flash('success', 'Purchase success');
										}
										res.redirect('/addons/' + addonId);

										// Lazy increment, no need to wait for user feedback or anything
										if (coupon.code !== '') return addon.incrementCoupon(coupon.code)
									}).catch(function (err) {
										PrettyError(err, "Something went wrong while calling addon.incrementCoupon inside AddonsController.accountBalanceCheckout:")
									});
							}
						}
					}
				});
		}
	},

	paypalCheckout: function (req, res) {
		var addonId:String = req.param('addonId');
		Addon.findOne(addonId).populate('author').populate('purchasers')
			.then(function (addon:Addon) {
				if (addon === undefined) return res.notFound();
				else if (addon.canDownload(req.user)) {
					req.flash('error', "You have already purchased this addon.");
					res.redirect('/addons/' + addonId);
				} else {
					var finalBill = parseInt(req.param('finalBill'));
					var coupon = req.param('coupon');
					var description = req.param('description');
					var amountToCharge = addon.price * 100;
					// If this addon is free, the user will pay whatever they want
					if (amountToCharge === 0) amountToCharge = finalBill;

					// A coupon is being used in this transaction
					if (coupon !== undefined && coupon !== null) {
						coupon = addon.getCoupon(coupon);
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
					} else coupon = {code: ''};

					// Uh-oh, someone is trying to commit fraud!
					if (amountToCharge !== finalBill) {
						req.user.status = User.Status.SUSPENDED;
						req.user.save()
							.then(function () {
								req.flash('error', "Fraudulent transaction detected, your account has been suspended. Please contact support for more information.");
								res.redirect('/contact');
							})
					} else {
						Transaction.create({
							sender: req.user,
							receiver: addon.author,
							senderType: 'purchase',
							receiverType: 'sale',
							addon: addon,
							amount: amountToCharge,
							inProgress: true,
							couponCode: coupon.code
						}).then(function (transaction) {
							var create_payment_json = {
								"intent": "sale",
								"payer": {
									"payment_method": "paypal"
								},
								"redirect_urls": {
									"return_url": sails.config.paypal.urlRoot + '/addons/' + addonId + '/paypalCheckout',
									"cancel_url": sails.config.paypal.urlRoot + '/addons/' + addonId + '/paypalCheckout'
								},
								"transactions": [{
									"item_list": {
										"items": [{
											"name": description,
											"sku": addon.id,
											"price": amountToCharge / 100,
											"currency": "USD",
											"quantity": 1
										}]
									},
									"amount": {
										"currency": "USD",
										"total": amountToCharge / 100
									},
									"description": description
								}]
							};
							req.flash('info', JSON.stringify(create_payment_json));

							PayPal.payment.create(create_payment_json, function (err, payment) {
								console.error(err)
								if (err) {
									PrettyError(err, "An error occurred during PayPal.payment.create inside AddonsController.paypalCheckout:");
									req.flash('error', "Something went wrong during PayPal checkout, please try again.");
									res.redirect('/addons/' + addonId)
								}
								else {
									transaction.paypalId = payment.id;
									transaction.paypalExecuteUrl = payment.links[2].href;
									transaction.save()
										.then(function () {
											res.redirect(payment.links[1].href);
										});
								}
							});
						});
					}
				}
			}).catch(function (err) {
				PrettyError(err, "An error occurred during Addon.findOne inside AddonsController.paypalCheckout:")
			});
	},

	paypalCheckoutGET: function (req, res) {
		var addonId = req.param('id');
		var paypalId = req.param('paymentId');
		var payerId = req.param('PayerID');

		if (paypalId === undefined && req.param('token') !== undefined) {
			req.flash('error', "You cancelled the PayPal checkout.");
			res.redirect('/addons/' + addonId)
		} else {
			Transaction.findOne({
				addon: addonId,
				paypalid: paypalId
			}).then(function (transaction:Transaction) {
				Needle.post(transaction.paypalExecuteUrl, {
					payer_id: payerId
				}, function (err, resp) {
					if (err) {
						PrettyError(err, "An error occurred during Needle.post inside AddonsController.paypalCheckoutGET:");
						req.flash('error', "Something went wrong during PayPal checkout, please try again.");
						res.redirect('/addons/' + addonId)
					} else {
						Addon.findOne(addonId)
							.then(function (addon:Addon) {
								transaction.inProgress = false;
								req.user.sentTransactions.add(transaction);
								addon.author.receivedTransactions.add(transaction);
								// If the user bought a paid addon we need to track the purchase
								if (addon.price > 0) {
									req.user.purchases.add(addon);
								}
								if (transaction.couponCode !== undefined) addon.incrementCoupon(transaction.couponCode);
								addon.author.balance += amountToCharge;
								return [addon, req.user.save(), addon.author.save(), transaction.save()];
							}).spread(function(addon) {
								if (addon.price === 0) {
									NotificationService.sendUserNotification(addon.author, "MEDIUM", req.user.username + " donated $" + transaction.amount / 100 + " USD to your addon, '" + addon.name);
									req.flash('success', 'Donation success');
								} else {
									NotificationService.sendUserNotification(addon.author, "MEDIUM", req.user.username + " purchased your addon, '" + addon.name + "' for $" + transaction.amount / 100);
									req.flash('success', 'Purchase success');
								}
								res.redirect('/addons/' + addonId);
							}).catch(function() {
								PrettyError(err, "An error occurred during Addon.findOne inside AddonsController.paypalCheckoutGET:");
								req.flash('warning', "Something went wrong but your purchase succeeded. You may be contacted by support.");
								res.redirect('/addons/' + addonId)
							})
					}
				})
			}).catch(function (err) {
				PrettyError(err, "An error occurred during Transaction.findOne inside AddonsController.paypalCheckoutGET:");
				req.flash('error', "Something went wrong during PayPal checkout, please try again.");
				res.redirect('/addons/' + addonId)
			})
		}
	},

	stripeCheckout: function (req, res) {
		var addonId:String = req.param('addonId');
		Addon.findOne(addonId).populate('author').populate('purchasers')
			.then(function (addon:Addon) {
				if (addon === undefined) return res.notFound();
				else if (addon.canDownload(req.user)) {
					req.flash('error', "You have already purchased this addon.");
					res.redirect('/addons/' + addonId);
				} else {
					var tokenId = req.param('tokenId');
					var finalBill = parseInt(req.param('finalBill'));
					var coupon = req.param('coupon');
					var description = req.param('description');
					var amountToCharge = addon.price * 100;

					// If this addon is free, the user will pay whatever they want
					if (amountToCharge === 0) amountToCharge = finalBill;

					// A coupon is being used in this transaction
					if (coupon !== undefined && coupon !== null) {
						coupon = addon.getCoupon(coupon);
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
					} else coupon = {code: ''};

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
							currency: 'USD',
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
								// Persist this transaction to the database
								Transaction.create({
									sender: req.user,
									receiver: addon.author,
									senderType: 'purchase',
									receiverType: 'sale',
									addon: addon,
									amount: amountToCharge,
									stripeData: charge,
									couponCode: coupon.code
								}).catch(function (error) {
									PrettyError(error, "Something went wrong while calling Transaction.create inside AddonsController.purchasePOST:")
								}).then(function (transaction) {
									req.user.sentTransactions.add(transaction);
									addon.author.receivedTransactions.add(transaction);
									// If the user bought a paid addon we need to track the purchase
									if (addon.price > 0) {
										req.user.purchases.add(addon);
									}
									addon.author.balance += amountToCharge - 30;
									return [req.user.save(), addon.author.save()]
								}).spread(function () {
									if (addon.price === 0) {
										NotificationService.sendUserNotification(addon.author, "MEDIUM", req.user.username + " donated $" + amountToCharge / 100 + " USD to your addon, '" + addon.name);
										req.flash('success', 'Donation success');
									} else {
										NotificationService.sendUserNotification(addon.author, "MEDIUM", req.user.username + " purchased your addon, '" + addon.name + "' for $" + amountToCharge / 100);
										req.flash('success', 'Purchase success');
									}
									res.redirect('/addons/' + addonId);

									// Lazy increment, no need to wait for user feedback or anything
									if (coupon.code !== '') return addon.incrementCoupon(coupon.code);
								}).catch(function (error) {
									console.log(error)
									PrettyError(error, "Something went wrong while saving transactions to users inside AddonsController.stripeCheckout:")
								})
							}
						});
					}
				}
			}).catch(function (err) {
				PrettyError(err, "Something went wrong inside AddonsController.stripeCheckout:")
			});
	},
};