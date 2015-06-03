/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />

module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: false
    },

    index: function (req, res) {
        res.view({title: "Your Profile", activeTab: 'profile.index', breadcrumbs: true});
    },

    addons: function (req, res) {
        res.view({
            title: "Your Addons",
            breadcrumbs: [["/profile", "Your Profile"]],
            activeTab: 'profile.addons'
        })
    },

    settings: function (req, res) {
        res.view({
            title: "Your Settings",
            breadcrumbs: [["/profile", "Your Profile"]],
            activeTab: 'profile.settings'
        })
    },

    settingsPOST: function (req, res) {
	    var oldEmail = req.user.email;

        if (req.body.username !== undefined && req.body.username !== '') req.user.username = req.body.username;
        req.user.email = req.body.primaryEmail;
        req.user.paypalEmail = req.body.paypalEmail;

        req.user.save()
            .then(function () {
		        // If the user updated their email, invite them to Slack
		        if (oldEmail !== req.user.email) SlackService.inviteUserToSlack(req.user);

                req.flash('success', "Your settings have been updated.");
                res.redirect('/profile/settings');
            }).catch(function (err) {
                PrettyError(err, 'An error occurred during User.update inside ProfileController.settingsPOST');
                req.flash('error', "Something went wrong while we were updating your settings. Please try again.");
                res.redirect('/profile/settings')
            })
    },

    jobs: function (req, res) {
        res.view({
            title: "Your Jobs",
            breadcrumbs: [["/profile", "Your Profile"]],
            activeTab: 'profile.jobs'
        })
    },

    createAddon: function (req, res) {
        res.view({
            title: "Create Addon",
            subtitle: "Create and Upload a New Addon",
            breadcrumbs: [['/profile', 'Your Profile']],
            activeTab: 'profile.createAddon'
        })
    },

    createAddonPOST: function (req, res) {
        if (req.files.zipFile === undefined) {
            req.flash('error', 'You must attach a file with your addon!');
            res.redirect('/profile/addons/create');
        } else if (req.body.price < 0) {
            req.flash('error', 'You cannot enter a negative price!');
            res.redirect('/profile/addons/create');
        } else if (req.body.explanation === undefined) {
            req.flash('error', 'You must provide an explanation with your addon!');
            res.redirect('/profile/addons/create');
        } else if (req.body.tags === undefined) {
	        req.flash('error', 'You must specify tags with your addon!');
	        res.redirect('/profile/addons/create');
        } else if (req.files.galleryImages === undefined || req.files.bannerImage === undefined || req.files.thinCardImage === undefined || req.files.wideCardImage === undefined) {
	        req.flash('error', 'You must provide all four types of image with your addon!');
	        res.redirect('/profile/addons/create');
        } else if (!Array.isArray(req.files.galleryImages) || req.files.galleryImages.length < 3) {
	        req.flash('error', 'You must provide at least 3 gallery images!');
	        res.redirect('/profile/addons/create');
        } else {
	        var galleryImages =_.map(req.files.galleryImages, function(file) {
		        return file.objectId.toString();
	        });

            Addon.create({
                // General tab
                name: req.body.name,
                price: req.body.price,
                gamemode: req.body.gamemode,
                type: req.body.type,
                zipFile: req.files.zipFile.objectId.toString(),
                size: req.files.zipFile.size,
                youtubeLink: req.body.youtubeLink,
                shortDescription: req.body.shortDescription,
                description: req.body.description,
                instructions: req.body.instructions,
                explanation: req.body.explanation,
                outsideServers: (req.body.outsideServers !== undefined),
                containsDrm: (req.body.containsDrm !== undefined),
                // Associations
                author: req.session.passport.user,
                rawTags: req.body.tags,
	            galleryImages: galleryImages,
	            thinCardImage: req.files.thinCardImage.objectId.toString(),
	            wideCardImage: req.files.wideCardImage.objectId.toString(),
	            bannerImage: req.files.bannerImage.objectId.toString()
            }).then(function (addon) {
                return [addon, User.findOne(req.session.passport.user).populate('addons')];
            }).spread(function (addon, user) {
                user.addons.add(addon);
                return [addon, user.save()]
            }).spread(function (addon) {
                sails.log.verbose("New addon was submitted and is awaiting approval:", addon);
                req.flash('success', "Addon '" + addon.name + "' has been submitted and is now waiting approval.");
                res.redirect('/profile/addons/' + addon.id)
            }).catch(function (err) {
                PrettyError(err, 'An error occurred during Addon.create inside ProfileController.createAddonPOST');
                req.flash('error', 'Something went wrong while submitting your addon. Please try again.');
                res.redirect('/profile/addons/create');
            });
        }
    },

    viewAddon: function (req, res) {
        var addonId = req.param('id');
        Addon.findOne(addonId)
            .then(function (addon) {
                // Addon exists
                if (addon !== undefined) {
                    // and is owned by the current user
                    if (addon.author === req.user.id) {
                        res.view({
                            //res.view('/profile/viewAddon', {
                            title: "View Addon",
                            subtitle: "Viewing Addon '" + addon.name + "'",
                            breadcrumbs: [['/profile', 'Your Profile'], ['/profile/addons', 'Your Addons']],
                            activeTab: 'profile.addons',
                            addon: addon
                        })
                    } else {
                        req.flash('error', "You do not have permission to access that addon.");
                        res.redirect('/profile/addons')
                    }
                } else {
                    req.flash('error', "The addon you are looking for does not exist.");
                    res.redirect('/profile/addons')
                }
            }).catch(function (err) {
                PrettyError(err, 'An error occurred during Addon.findOne inside ProfileController.viewAddon');
                req.flash('error', "An error occurred while trying to view that addon. Please try again.");
                res.redirect('/profile/addons')
            });
    },

    editAddon: function (req, res) {
        var addonId = req.param('id');
        Addon.findOne(addonId)
            .then(function (addon) {
                if (addon !== undefined) {
                    if (addon.canModify(req.user)) {
                        res.view({
                            title: "Edit Addon",
                            subtitle: "Editing Addon '" + addon.name + "'",
                            breadcrumbs: [['/profile', 'Your Profile'], ['/profile/addons', 'Your Addons'], ['/profile/addons/' + addonId, 'View Addon']],
                            activeTab: 'profile.addons',
                            addon: addon
                        })
                    } else {
                        res.send(403)
                    }
                } else {
                    res.send(404)
                }
            }).catch(function (err) {
                PrettyError(err, 'An error occurred during Addon.findOne inside ProfileController.editAddon');
                req.flash('error', "Something went wrong while trying to edit addon " + addonId);
                res.redirect('/profile/addons/' + addonId);
            });
    },

    editAddonPOST: function (req, res) {
        var addonId = req.param('id');
        Addon.findOne(addonId)
            .then(function (addon:Addon) {
                if (addon !== undefined) {
                    if (addon.canModify(req.user)) {
                        req.body.outsideServers = req.body.outsideServers !== undefined;
                        req.body.containsDrm = req.body.containsDrm !== undefined;
                        req.body.status = Addon.Status.PENDING;
                        if (req.files.zipFile !== undefined) {
                            req.body.zipFile = req.files.zipFile.objectId.toString();
                            req.body.size = req.files.zipFile.size;
                        }

	                    if (req.files.bannerImage !== undefined) req.body.bannerImage = req.files.bannerImage.objectId.toString();
	                    if (req.files.cardImage !== undefined) req.body.cardImage = req.files.cardImage.objectId.toString();
						if (req.files.galleryImages !== undefined) {
							req.body.galleryImages = _.map(req.files.galleryImages, function(file) {
								return file.objectId.toString();
							});
						}

                        var oldStatus = addon.status;
                        Addon.update(addonId, req.body)
                            .then(function () {
                                if (oldStatus === Addon.Status.PUBLISHED) {
                                    addon.decrementTags(function () {
                                        req.flash('success', "Addon " + addonId + " updated successfully");
                                    })
                                } else {
                                    req.flash('success', "Addon " + addonId + " updated successfully");
                                }
                            })
                            .catch(function (err) {
                                req.flash('error', "Something went wrong while trying to update addon " + addonId);
                                PrettyError(err, 'An error occurred during Addon.update inside ProfileController.editAddonPOST')
                            }).finally(function () {
                                res.redirect('/profile/addons/' + addonId);
                            })
                    } else {
                        res.send(403)
                    }
                } else {
                    res.send(404)
                }
            }).catch(function (err) {
                PrettyError(err, 'An error occurred during Addon.findOne inside ProfileController.editAddonPOST');
                req.flash('error', "Something went wrong while trying to update addon " + addonId);
                res.redirect('/profile/addons/' + addonId);
            });
    },

    removeAddon: function (req, res) {
        var addonId = req.param('id');
        Addon.findOne(addonId)
            .then(function (addon) {
                if (addon !== undefined) {
                    if (addon.canModify(req.user)) {
                        Addon.destroy(addonId)
                            .then(function () {
                                req.flash('success', "Addon " + addonId + " removed successfully");
                            })
                            .catch(function (err) {
                                req.flash('error', "Something went wrong while trying to remove addon " + addonId);
                                return PrettyError(err, 'An error occurred during Addon.update inside ProfileController.removeAddonPOST:')
                            }).finally(function () {
                                res.redirect('/profile/addons/');
                            })
                    } else {
                        res.send(403)
                    }
                } else {
                    res.send(404)
                }
            }).catch(function (err) {
                PrettyError(err, 'An error occurred during Addon.findOne inside ProfileController.removeAddon');
                req.flash('error', "Something went wrong while trying to remove addon " + addonId);
                res.redirect('/profile/addons/' + addonId);
            });
    },

    publishAddon: function (req, res) {
        var addonId = req.param('id');
	    Addon.findOne(addonId)
		    .then(function (addon:Addon) {
			    if (addon !== undefined) {
				    if (addon.canModify(req.user)) {
					    if (addon.status === Addon.Status.APPROVED) {
						    addon.status = Addon.Status.PUBLISHED;
						    addon.save()
							    .then(function () {
								    addon.incrementTags(function () {
									    req.flash('success', "Addon '" + addon.name + "' has been published");
									    res.redirect('/profile/addons/' + addonId);
								    });
							    });
					    } else {
						    req.flash('error', "You cannot publish an addon that is not approved.");
						    res.redirect('/profile/addons/' + addonId);
					    }
				    } else {
					    res.send(403)
				    }
			    } else {
				    res.send(404)
			    }
		    }).catch(function (err) {
			    PrettyError(err, 'An error occurred during Addon.findOne inside ProfileController.publishAddon');
			    req.flash('error', "Something went wrong while trying to publish addon " + addonId);
			    res.redirect('/profile/addons/' + addonId);
		    });
    },

	previewAddon: function(req, res) {
		var addonId = req.param('id');
		Addon.findOne(addonId)
			.then(function (addon:Addon) {
				if (addon === undefined) res.notFound();
				else if (!addon.canModify(req.user)) res.forbidden();
				else {
					res.view('addons/viewaddon', {
						title: addon.name,
						activeTab: 'profile.addons',
						breadcrumbs: [['/profile', 'Your Profile'], ['/profile/addons', 'Your Addons'], ['/profile/addons/' + addonId, 'View Addon'], ['/profile/addons/' + addonId + '/preview', 'Preview Addon']],
						addon: addon
					})
				}
			}).catch(function (err) {
				PrettyError(err, 'An error occurred during Addon.findOne inside ProfileController.previewAddon');
				req.flash('error', "Something went wrong while trying to preview addon " + addonId);
				res.redirect('/profile/addons/' + addonId);
			});
	},

    tickets: function (req, res) {
        if (req.isSocket) Ticket.subscribe(req.socket, req.user.tickets);
        else {
            var promises = [];
            req.user.tickets.forEach(function (ticket) {
                promises.push(
                    TicketResponse.find({ticket: ticket.id}).populate('responses')
                        .then(function (responses) {
                            ticket.responses = responses;
                        })
                );
            });

            Promise.all(promises)
                .then(function () {
                    res.view({
                        title: "Tickets",
                        subtitle: "Manage Your Tickets",
                        breadcrumbs: [['/profile', 'Your Profile']],
                        activeTab: 'profile.tickets'
                    })
                }).catch(function (err) {
                    PrettyError(err, 'An error occurred during Promise.all inside ProfileController.tickets');
                    req.flash('error', "Something went wrong while displaying your tickets");
                    res.redirect('/profile');
                })
        }
    },

    createTicket: function (req, res) {
        res.view({
            title: "Create Ticket",
            subtitle: "Create a New Ticket",
            breadcrumbs: [['/profile', 'Your Profile'], ['/profile/tickets', 'Tickets']],
            activeTab: 'profile.tickets'
        })
    },

    createTicketPOST: function (req, res) {
        var tick;
        Ticket.create({
            title: req.param('title'),
            priority: req.param('priority'),
            affectedAddon: req.param('affectedAddon') || '',
            submitter: req.user
        }).then(function (ticket) {
            tick = ticket;
            return [ticket.addResponse(req.user, req.param('content')), req.user.sentTickets.add(ticket)]
        }).spread(function () {
            req.flash('success', 'Ticket created successfully');
            res.redirect('/profile/tickets/')
        }).catch(function (err) {
            PrettyError(err, 'An error occurred during Ticket.create inside ProfileController.createTicketPOST');
            req.flash('error', 'Something went wrong while creating your ticket');
            tick.destroy()
                .then(res.redirect('/profile/tickets/create'))
        });
    },

    respondPOST: function (req, res) {
        var ticketId = req.param('id');
        Ticket.findOne(ticketId)
            .then(function (ticket) {
                if (ticket === undefined) res.send(404);
                else if (!ticket.canRespond(req.user)) res.send(403);
                else {
                    return ticket.addResponse(req.user, req.param('content'))
                        .then(function () {
                            Ticket.publishUpdate(ticketId, {
                                type: 'newResponse',
                                user: req.user,
                                content: req.param('content')
                            });
                        });
                }
            }).catch(function (err) {
                PrettyError(err, 'An error occurred during Ticket.findOne inside ProfileController.respondPOST');
                req.socket.emit('notification', {
                    type: 'error',
                    msg: 'Something went wrong while responding to your ticket'
                });
            });
    },

    close: function (req, res) {
        var ticketId = req.param('id');
        Ticket.findOne(ticketId)
            .then(function (ticket) {
                if (ticket === undefined) res.send(404);
                else if (!ticket.canClose(req.user)) res.send(403);
                else {
                    Ticket.update(ticketId, {status: TicketStatus.CLOSED})
                        .then(function () {
                            Ticket.publishUpdate(ticketId, {
                                type: 'closed'
                            });
                        })
                }
            }).catch(function (err) {
                PrettyError(err, 'An error occurred during Ticket.findOne inside ProfileController.closePOST');
                req.socket.emit('notification', {
                    type: 'error',
                    msg: 'Something went wrong while closing your ticket'
                });
            });
    },

    transactions: function(req, res) {
        var populatePromiseArray = [];
        req.user.transactions.forEach(function(transaction) {
            populatePromiseArray.push(Transaction.findOne(transaction.id).populate('sender').populate('receiver').populate('addon'));
        });

        Promise.all(populatePromiseArray)
        .then(function(populatedTransactions) {
                req.user.transactions = populatedTransactions;
                res.view({
                    title: 'Your Transactions',
                    breadcrumbs: [["/profile", "Your Profile"]],
                    activeTab: 'profile.transactions'
                })
            });

    },

	syncSteam: function(req, res) {
		req.user.steamProfile = {};
		req.user.save()
		.then(function() {
				req.logout();
				res.redirect('/auth/login');
			});
	},

	couponsPOST: function(req, res) {
		var addonId = req.param('id');

		var code:String = req.param('code');
		var amount:Number = parseInt(req.param('amount'));
		var type:Number = parseInt(req.param('type'));

		if (amount === undefined || code === undefined || type === undefined) { // If they forgot to enter a parameter
			req.flash('error', "You failed to completely fill out the coupon form, please try again.");
			res.redirect('/profile/addons/' + addonId);
		} else if (amount <= 0 || amount >= 100) { // If the amount is invalid
			req.flash('error', 'You entered an invalid amount, please try again.');
			res.redirect('/profile/addons/' + addonId);
		} else if (code.length > 16) { // If the length of the code is too long
			req.flash('error', 'The maximum coupon code length is 16 characters, please try again.');
			res.redirect('/profile/addons/' + addonId);
		} else if (type !== 0 && type !== 1) { // If the type is invalid
			req.flash('error', 'You have specified an invalid coupon type, please try again.');
			res.redirect('/profile/addons/' + addonId);
		} else {
			Addon.findOne(addonId).populate('tags').populate('reviews').populate('purchasers')
			.then(function(addon:Addon) {
					if (addon === undefined) res.notFound();
					else if (!addon.canModify(req.user)) res.forbidden();
					else if (addon.couponExists(code)) {
						req.flash('error', "You have already created a coupon with that code.");
						res.redirect('/profile/addons/' + addonId);
					} else {
						code = code.toUpperCase();
						return addon.addCoupon(code, amount, type)
					}
				})
				.then(function() {
					req.flash('success', "Coupon '" + code + "' has been created.");
					res.redirect('/profile/addons/' + addonId)
				});
		}
	},

	deactivateCoupon: function(req, res) {
		var addonId = req.param('id');
		var code:String = req.param('code');

		Addon.findOne(addonId)
			.then(function(addon:Addon) {
				if (addon === undefined) res.notFound();
				else if (!addon.canModify(req.user)) res.forbidden();
				else if (!addon.couponExists(code)) {
					req.flash('error', "That coupon does not exist.");
					res.redirect('/profile/addons/' + addonId);
				} else if (!addon.isValidCoupon(code)) {
					req.flash('error', "That coupon has already expired.");
					res.redirect('/profile/addons/' + addonId);
				} else {
					return addon.deactivateCoupon(code);
				}
			})
			.then(function() {
				req.flash('success', "Coupon '" + code + "' has been deactivated.");
				res.redirect('/profile/addons/' + addonId)
			});
	}
};

