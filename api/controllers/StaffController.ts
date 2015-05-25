/// <reference path='../../typings/node/node.d.ts' />

var Promise = require('bluebird');

module.exports = {
    _config: {
        actions: true,
        shortcuts: false,
        rest: false
    },

    addons: function (req, res) {
        Addon.find({status: 'pending'}).populateAll()
            .then(function (addons) {
                res.view({
                    title: "Unapproved Addons",
                    activeTab: 'staff.addons',
                    addons: addons,
                    breadcrumbs: true
                })
            });
    },

    approveAddon: function (req, res) {
        var addonId = req.param('addonId');
        Addon.update(addonId, {status: 'approved'})
            .then(function (addon) {
                if (req.isSocket) {
                    req.socket.emit('notification', {type: 'success', msg: 'Addon approved.'});
                } else {
                    req.flash('success', 'Addon approved.');
                    res.redirect('/staff/addons');
                }
            })
            .catch(function (err) {
                PrettyError(err, 'An error occurred during Addon.update inside StaffController.approveAddon');
                if (req.isSocket) {
                    req.socket.emit('notification', {type: 'error', msg: 'Something went wrong: ' + err});
                } else {
                    req.flash('error', 'Something went wrong: ' + err);
                    res.redirect('/staff/addons');
                }
            });
    },

    denyAddon: function (req, res) {
        var addonId = req.param('addonId');
        Addon.update(addonId, {status: 'denied'})
            .then(function (addon) {
                if (req.isSocket) {
                    req.socket.emit('notification', {type: 'success', msg: 'Addon denied.'});
                } else {
                    req.flash('success', 'Addon denied.');
                    res.redirect('/staff/addons');
                }
            })
            .catch(function (err) {
                PrettyError(err, 'An error occurred during Addon.update inside StaffController.denyAddon');
                if (req.isSocket) {
                    req.socket.emit('notification', {type: 'error', msg: 'Something went wrong: ' + err});
                } else {
                    req.flash('error', 'Something went wrong: ' + err);
                    res.redirect('/staff/addons');
                }
            });
    },

    tickets: function (req, res) {
        Ticket.find({status: 'submitterResponse'}).populateAll()
            .then(function (tickets) {
                res.view({
                    title: "Ticket Queue",
                    activeTab: 'staff.tickets',
                    tickets: tickets,
                    breadcrumbs: true
                })
            }).catch(function (err) {
                PrettyError(err, 'An error occurred during Ticket.find inside StaffController.tickets');
                req.flash('error', 'Something went wrong: ' + err);
                res.redirect('/');
            });
    },

    viewTicket: function (req, res) {
        var ticketId = req.param('id');
        if (req.isSocket) Ticket.subscribe(req.socket, ticketId);
        else {
            Ticket.findOne(ticketId).populateAll()
                .then(function (ticket) {
                    if (ticket === undefined) return res.send(404);

                    var promises = []
                    ticket.responses.forEach(function(response) {
                        promises.push(TicketResponse.findOne(response.id).populateAll())
                    });

                    Promise.all(promises)
                    .then(function(responses) {
                            ticket.responses = responses;
                            res.view({
                                title: "Viewing Ticket " + ticketId,
                                activeTab: 'staff.tickets',
                                breadcrumbs: [['/staff/tickets', "Ticket Queue"]],
                                ticket: ticket
                            })
                        })
                })
                .catch(function (err) {
                    PrettyError(err, "An error occurred during Ticket.findOne inside StaffController.viewTicket");
                    req.flash('error', 'Something went wrong while trying to view ticket ' + ticketId);
                    res.redirect('/staff/tickets')
                })
        }
    },

    respondToTicket: function (req, res) {
        var ticketId = req.param('id');
        Ticket.findOne(ticketId)
            .then(function (ticket) {
                if (ticket === undefined) return res.send(404);

                return ticket.addResponse(req.user, req.param('content'))
                    .then(function () {
                        Ticket.publishUpdate(ticketId, {
                            type: 'newResponse',
                            user: req.user,
                            content: req.param('content')
                        });
                    });
            }).catch(function (err) {
                PrettyError(err, 'An error occurred during Ticket.findOne inside StaffController.respondToTicket');
                req.socket.emit('notification', {
                    type: 'error',
                    msg: 'Something went wrong while responding to ticket ' + ticketId
                });
            });
    }
};

