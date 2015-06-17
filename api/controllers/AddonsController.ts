/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />
/// <reference path='../../typings/stripe/stripe-node.d.ts' />

var PayPal = require('paypal-rest-sdk');
PayPal.configure({
	mode: 'sandbox',
	client_id: sails.config.paypal.clientId,
	client_secret: sails.config.paypal.secret,
});
var Needle = require('needle');
var NewRelic = require('newrelic');

module.exports = {
	_config: {
		actions: false,
		shortcuts: false,
		rest: false
	},

	index: function (req, res) {
		NewRelic.setControllerName('AddonsController.index');
		Promise.join(Addon.count({status: Addon.Status.PUBLISHED}), Addon.find({status: Addon.Status.PUBLISHED}).paginate({
			page: 0,
			limit: 10
		}).populate('author').populate('tags'), function (totalAddons, addons) {
			addons.forEach(function (addon) {
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
		NewRelic.setControllerName('AddonsController.viewAddon');
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
					      addon.purchasers = _.map(addon.purchasers, function (user) {
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
		NewRelic.setControllerName('AddonsController.download');
		var addonId:String = req.param('id');
		Addon.findOne(addonId).populate('purchasers')
			.then(function (addon:Addon) {
				      if (addon === undefined) res.send(404);
				      else if (!addon.canDownload(req.user)) res.send(403);
				      else {
					      // Get the file and it's metadata from GridFS
					      sails.hooks.gfs.findOne({_id: addon.zipFile}, function (err, file) {
						      if (err) {
							      PrettyError(err, 'An error occurred during sails.hooks.gfs.exist inside AddonsController.download');
							      res.send(500);
						      } else if (!file) {
							      res.send(404);
						      }
						      else {
							      // Increment download count
							      addon.downloads++;
							      addon.save();

							      // Build the response
							      res.type(file.contentType);
							      res.set({
								      'Content-Disposition': 'attachment; filename="' + file.filename + '"',
								      'Content-Length': file.length
							      });
							      sails.hooks.gfs.createReadStream({
								      _id: addon.zipFile,
								      chunkSize: 1024 * 1024
							      }).pipe(res);
						      }
					      });
				      }
			      })
			.catch(function (err) {
				       PrettyError(err, 'Error occurred during Addon.findOne inside AddonsController.download');
				       res.send(500);
			       });
	},

	artwork: function (req, res) {
		NewRelic.setControllerName('AddonsController.artwork');
		var addonId:string = req.param('id');
		var artwork:string = req.param('artwork');
		Addon.findOne(addonId)
			.then(function (addon:Addon) {
				      if (addon === undefined) res.send(404);
				      else if (addon.status !== Addon.Status.PUBLISHED && !addon.canModify(req.user)) res.send(403);
				      else if (addon.galleryImages.indexOf(artwork) === -1 && addon.bannerImage !== artwork && addon.cardImage !== artwork) res.send(403);
				      else {
					      // Get the file and it's metadata from GridFS
					      sails.hooks.gfs.findOne({_id: artwork}, function (err, file) {
						      if (err) {
							      PrettyError(err, 'An error occurred during sails.hooks.gfs.exist inside AddonsController.download');
							      res.send(500);
						      } else if (!file) {
							      res.send(404);
						      }
						      else {
							      // Build the response
							      res.type(file.contentType);
							      res.set({
								      'Content-Disposition': 'inline; filename="' + file.filename + '"',
								      'Content-Length': file.length,
								      'ETag': file.md5
							      });
							      sails.hooks.gfs.createReadStream({
								      _id: artwork,
								      chunkSize: 1024 * 1024
							      }).pipe(res);
						      }
					      });
				      }
			      }).catch(function (err) {
				               PrettyError(err, 'Error occurred during Addon.findOne inside AddonsController.download');
				               res.send(500);
			               });
	},

	validateCoupon: function (req, res) {
		NewRelic.setControllerName('AddonsController.validateCoupon');
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

	checkout: function (req, res) {
		NewRelic.setControllerName('AddonsController.checkout');
		var addonId:String = req.param('addonId');
		Addon.findOne(addonId).populate('author').populate('purchasers')
			.then(function (addon:Addon) {
				      if (addon === undefined) res.notFound();
				      else if (addon.canDownload(req.user)) {
					      req.flash('warning', "You already own '" + addon.name + "'");
					      res.redirect('/addons/' + addonId)
				      } else {
					      // How much the client thinks they are being charged for
					      var clientBill:number = parseInt(req.param('bill'));

					      // Calculate how much we're ACTUALLY going to bill
					      var amountToCharge:number;
					      var type:Transaction.Type;
					      if (addon.price === 0) {
						      amountToCharge = clientBill;
						      type = Transaction.Type.DONATION;
					      } else {
						      amountToCharge = addon.price;
						      type = Transaction.Type.PURCHASE;
					      }

					      // Calculate coupon related stuff (if one was supplied)
					      var couponCode = req.param('couponCode');
					      if (couponCode !== undefined) {
						      var coupon:Coupon = addon.getCoupon(couponCode);
						      // Detect fraudulent coupons
						      if (coupon === null || coupon.expired) {
							      console.log('Bad coupon', coupon);
							      req.user.status = User.Status.SUSPENDED;
							      return [true, req.user.save()];
						      } else {
							      if (coupon.type === Coupon.Type.PERCENTAGE) amountToCharge = addon.price * (1.0 - coupon.amount / 100);
							      else if (coupon.type === Coupon.Type.FIXED) amountToCharge = (addon.price - coupon.amount);
						      }
					      }

					      // If the client tried to give us an incorrect bill, they are likely trying to commit fraud
					      if (amountToCharge !== clientBill) {
						      console.log("Bills didn't match", amountToCharge, clientBill);
						      req.user.status = User.Status.SUSPENDED;
						      return [true, req.user.save()]
					      }

					      var paymentMethod:Transaction.PaymentMethod = parseInt(req.param('paymentMethod'));
					      // If a coupon set the bill to less than 0, set the bill to 0 and make sure we checkout with
					      // account balance
					      if (couponCode !== undefined && amountToCharge < 0) {
						      amountToCharge = 0;
						      paymentMethod = Transaction.PaymentMethod.ACCOUNT_BALANCE;
					      }

					      var metadata;
					      if (req.param('metadata') !== undefined) metadata = JSON.parse(req.param('metadata'));
					      else metadata = {};

					      metadata.coupon = couponCode;
					      var description = req.param('description');

					      var paymentPromise;
					      switch (paymentMethod) {
						      case Transaction.PaymentMethod.ACCOUNT_BALANCE:
							      paymentPromise = PaymentService.accountBalancePayment(amountToCharge, type, req.user, addon.author, description, metadata, addon);
							      break;
						      case Transaction.PaymentMethod.CREDIT_CARD:
							      paymentPromise = PaymentService.creditCardPayment(amountToCharge, type, req.user, addon.author, description, metadata, addon);
							      break;
						      case Transaction.PaymentMethod.PAYPAL:
							      paymentPromise = PaymentService.paypalPayment(amountToCharge, type, req.user, addon.author, description, metadata, addon);
							      break;
						      default:
							      console.log("Bad payment method", paymentMethod);
							      req.user.status = User.Status.SUSPENDED;
							      return [true, req.user.save()];
					      }
					      paymentPromise.then(function () {
						      var promises = [];
						      if (coupon) promises.push(addon.incrementCoupon(couponCode));
						      if (addon.price > 0) {
							      addon.author = addon.author.id;
							      addon.purchasers.add(req.user);
							      req.user.purchases.add(addon);
							      promises.push(addon.save(), req.user.save());
						      }
						      return promises;
					      }).then(function() {
                  NotificationService.sendUserNotification(addon.author, Notification.Priority.MEDIUM, req.user.username + " purchased " + addon.name + " for $" + amountToCharge / 100, "/profile/finances");

						      req.flash('success', "Purchase successful!");
						      res.redirect('/addons/' + addonId);
					      }).catch(function (err) {
						      if (err === Transaction.FailReason.INSUFFICIENT_FUNDS) {
							      req.flash('error', "You did not have the required funds to complete the transaction");
						      } else if (err === Transaction.FailReason.CARD_DECLINED) {
							      req.flash('error', "Your credit card was declined");
						      } else if (err === Transaction.FailReason.GENERAL_ERROR) {
							      req.flash('error', "Something went wrong, please try again");
						      } else {
							      PrettyError(err, "Encountered unknown error during AddonsController.checkout");
							      req.flash('error', "Something went wrong, please try again");
						      }
						      res.redirect('/addons/' + addonId);
					      });
				      }
			      })
			.catch(function (err) {
				       req.flash('error', "error");
				       PrettyError(err, "uh oh");
				       res.redirect('/addons');
			       });
	},

	paypalCheckout: function (req, res) {
		NewRelic.setControllerName('AddonsController.paypalCheckout');
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
					      var type = 'purchase';
					      if (addon.price === 0) type = 'donation';

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
							      senderType: type,
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
		NewRelic.setControllerName('AddonsController.paypalCheckoutGET');
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
							      }).spread(function (addon) {
								                if (addon.price === 0) {
									                NotificationService.sendUserNotification(addon.author, "MEDIUM", req.user.username + " donated $" + transaction.amount / 100 + " USD to your addon, '" + addon.name);
									                req.flash('success', 'Donation success');
								                } else {
									                NotificationService.sendUserNotification(addon.author, "MEDIUM", req.user.username + " purchased your addon, '" + addon.name + "' for $" + transaction.amount / 100);
									                req.flash('success', 'Purchase success');
								                }
								                FeeService.chargeFee(addon.author);
								                res.redirect('/addons/' + addonId);
							                }).catch(function () {
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
};
