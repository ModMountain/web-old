/// <reference path='../../typings/node/node.d.ts' />

/**
 * StaticController
 *
 * @description :: Server-side logic for managing Statics
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
    _config: {
        actions: true,
        shortcuts: false,
        rest: false
    },

    index: function (req, res) {
        res.view({title: "Staff", activeTab: 'staff', breadcrumbs: [['/staff', "Staff"]]});
    },

    addons: function (req, res) {
        Addon.find({status: 'pending'})
            .then(function (addons) {
                res.view({title: "Unapproved Addons", activeTab: 'staff', breadcrumbs: [['/staff', "Staff"], ['/staff/addons', 'Unapproved Addons']], addons: addons})
            });
    },

    users: function (req, res) {
        User.find()
            .then(function (users) {
                res.view({title: "Users", activeTab: 'staff', breadcrumbs: [['/staff', "Staff"], ['/staff/users', "Users"]], users: users});
            });
    }
};

