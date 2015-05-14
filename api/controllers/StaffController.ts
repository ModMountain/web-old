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
                    breadcrumbs: [['/staff/addons', "Unapproved Addons"]],
                    addons: addons
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
                console.error("An error occurred during Addon.update inside StaffController.approveAddon:", err);
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
                console.error("An error occurred during Addon.update inside StaffController.denyAddon:", err);
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
                    breadcrumbs: [['/staff/tickets', "Ticket Queue"]],
                    tickets: tickets
                })
            }).catch(function (err) {
                console.error("An error occurred during Ticket.find inside StaffController.tickets:", err);
                req.flash('error', 'Something went wrong: ' + err);
                res.redirect('/');
            });
    }
};

