/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />

var NewRelic = require('newrelic');

module.exports = {
    _config: {
        actions: true,
        shortcuts: false,
        rest: false
    },

    addons: function (req, res) {
	    NewRelic.setControllerName('StaffController.addons');
	    Addon.find({status: Addon.Status.PENDING}).populate('author')
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
	    NewRelic.setControllerName('StaffController.approveAddon');
	    var addonId = req.param('addonId');
        Addon.update(addonId, {status: Addon.Status.APPROVED})
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
	    NewRelic.setControllerName('StaffController.denyAddon');
	    var addonId = req.param('addonId');
        Addon.update(addonId, {status: Addon.Status.DENIED})
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
    }
};

