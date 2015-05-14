/// <reference path='../../typings/node/node.d.ts' />

module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: false
    },

    index: function (req, res) {
        res.view({title: "Your Profile", breadcrumbs: [["/profile", "Your profile"]], activeTab: 'profile.index'});
    },

    addons: function (req, res) {
        res.view({
            title: "Your Addons",
            breadcrumbs: [["/profile", "Your Profile"], ["/profile/addons", "Your Addons"]],
            activeTab: 'profile.addons'
        })
    },

    settings: function (req, res) {
        res.view({
            title: "Your Settings",
            breadcrumbs: [["/profile", "Your Profile"], ["/profile/jobs", "Your Settings"]],
            activeTab: 'profile.settings'
        })
    },

    settingsPOST: function (req, res) {
        if (req.body.username !== undefined && req.body.username !== '') req.user.username = req.body.username;
        if (req.body.primaryEmail !== undefined && req.body.primaryEmail !== '') req.user.email = req.body.primaryEmail;

        req.user.save()
            .then(function () {
                req.flash('success', "Your settings have been updated.");
                res.redirect('/profile/settings');
            }).catch(function (err) {
                console.error("An error occurred during User.update inside ProfileController.settingsPOST:", err);
                req.flash('error', "Something went wrong while we were updating your settings. Please try again.");
                res.redirect('/profile/settings')
            })
    },

    jobs: function (req, res) {
        res.view({
            title: "Your Jobs",
            breadcrumbs: [["/profile", "Your Profile"], ["/profile/jobs", "Your Jobs"]],
            activeTab: 'profile.jobs'
        })
    },

    createAddon: function (req, res) {
        res.view({
            title: "Create Addon",
            subtitle: "Create and Upload a New Addon",
            breadcrumbs: [['/profile', 'Your Profile'], ['/profile/createAddon', 'Create Addon']],
            activeTab: 'profile.createAddon'
        })
    },

    createAddonPOST: function (req, res) {
        Addon.create({
            // General tab
            name: req.body.name,
            price: req.body.price,
            gamemode: req.body.gamemode,
            category: req.body.category,
            zipFile: req.files.zipFile.objectId.toString(), //FIXME zip file does not need to be uploaded for form to
                                                            // submit
            description: req.body.description,
            instructions: req.body.instructions,
            explanation: req.body.explanation,
            outsideServers: (req.body.outsideServers !== undefined),
            containsDrm: (req.body.containsDrm !== undefined),
            // Associations
            author: req.session.passport.user
        }).then(function (addon) {
            return [addon, User.findOne(req.session.passport.user).populate('addons')];
        }).spread(function (addon, user) {
            user.addons.add(addon);
            return [user.save(), addon]
        }).spread(function (save, addon) {
            console.log("New addon was submitted and is awaiting approval:", addon);
            req.flash('success', "Addon '" + addon.name + "' has been submitted and is now waiting approval.");
            res.redirect('/profile/addons')
        }).catch(function (err) {
            console.error("An error occurred during Addon.create inside ProfileController.createAddonPOST:", err);
            req.flash('error', 'Something went wrong while submitting your addon. Please try again.');
        });
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
                            breadcrumbs: [['/profile', 'Your Profile'], ['/profile/addons', 'Your Addons'], ['/profile/addons/' + addonId, 'View Addon']],
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
                console.error("An error occurred during Addon.findOne inside ProfileController.viewAddon:", err);
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
                            breadcrumbs: [['/profile', 'Your Profile'], ['/profile/addons', 'Your Addons'], ['/profile/addons/' + addonId, 'View Addon'], ['/profile/addons/' + addonId + '/edit', 'Edit Addon']],
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
                console.error("An error occurred during Addon.findOne inside ProfileController.editAddon:", err);
                req.flash('error', "Something went wrong while trying to edit addon " + addonId);
                res.redirect('/profile/addons/' + addonId);
            });
    },

    editAddonPOST: function (req, res) {
        var addonId = req.param('id');
        Addon.findOne(addonId)
            .then(function (addon) {
                if (addon !== undefined) {
                    if (addon.canModify(req.user)) {
                        req.body.outsideServers = req.body.outsideServers !== undefined;
                        req.body.containsDrm = req.body.containsDrm !== undefined;
                        req.body.status = 'pending';
                        req.body.zipFile = req.files.zipFile.objectId.toString();

                        Addon.update(addonId, req.body)
                            .then(function () {
                                req.flash('success', "Addon " + addonId + " updated successfully");
                            })
                            .catch(function (err) {
                                console.error("An error occurred during Addon.update inside ProfileController.editAddonPOST:", err);
                                req.flash('error', "Something went wrong while trying to update addon " + addonId);
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
                console.error("An error occurred during Addon.findOne inside ProfileController.editAddonPOST:", err);
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
                                console.error("An error occurred during Addon.update inside ProfileController.removeAddonPOST:", err);
                                req.flash('error', "Something went wrong while trying to update addon " + addonId);
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
                console.error("An error occurred during Addon.findOne inside ProfileController.removeAddonPOST:", err);
                req.flash('error', "Something went wrong while trying to remove addon " + addonId);
                res.redirect('/profile/addons/' + addonId);
            });
    },

    tickets: function (req, res) {
        if (req.isSocket) Ticket.subscribe(req.socket, req.user.tickets);
        else {
            var promises = [];
            req.user.tickets.forEach(function (ticket) {
                promises.push(
                    TicketResponse.find({ticket: ticket.id}).populateAll()
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
                        breadcrumbs: [['/profile', 'Your Profile'], ['/profile/tickets', 'Tickets']],
                        activeTab: 'profile.tickets'
                    })
                }).catch(function (err) {
                    console.error("An error occurred during Promise.all inside ProfileController.tickets:", err);
                    req.flash('error', "Something went wrong while displaying your tickets");
                    res.redirect('/profile');
                })
        }
    },

    createTicket: function (req, res) {
        res.view({
            title: "Create Ticket",
            subtitle: "Create a New Ticket",
            breadcrumbs: [['/profile', 'Your Profile'], ['/profile/tickets', 'Tickets'], ['/profile/tickets/create', 'Create Ticket']],
            activeTab: 'profile.tickets'
        })
    },

    createTicketPOST: function (req, res) {
        Ticket.create({
            title: req.param('title'),
            priority: req.param('priority'),
            affectedAddon: req.param('affectedAddon') || '',
            submitter: req.user
        }).then(function (ticket) {
            return [ticket.addResponsse(req.user, req.param('content')), req.user.sentTickets.add(ticket)]
        }).spread(function () {
            req.flash('success', 'Ticket created successfully');
            res.redirect('/profile/tickets/')
        }).catch(function (err) {
            console.error("An error occurred during Ticket.create inside ProfileController.createTicketPOST:", err);
            req.flash('error', 'Something went wrong while creating your ticket');
            res.redirect('/profile/tickets/create')
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
                        .then(Ticket.publishUpdate(ticketId, {
                            type: 'newResponse',
                            user: req.user,
                            content: req.param('content')
                        })
                    );
                }
            }).catch(function (err) {
                PrettyError(err, 'An error occurred during Ticket.findOne inside ProfileController.respondPOST')
                    .then(function () {
                        req.socket.emit('notification', {
                            type: 'error',
                            msg: 'Something went wrong while responding to your ticket'
                        })
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
                    Ticket.update(ticketId, {status: 'closed'})
                        .then(Ticket.publishUpdate(ticketId, {
                            type: 'closed'
                        }))
                }
            }).catch(function (err) {
                PrettyError(err, 'An error occurred during Ticket.findOne inside ProfileController.closePOST')
                    .then(function () {
                        req.socket.emit('notification', {
                            type: 'error',
                            msg: 'Something went wrong while closing your ticket'
                        })
                    });
            });
    }
};

