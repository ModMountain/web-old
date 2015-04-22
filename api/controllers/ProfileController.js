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
        res.view({ title: "Your Profile", breadcrumb: [["/profile", "Your profile"]], activeTab: 'profile.index' });
    },
    addons: function (req, res) {
        User.findOne(req.user.id).populate('addons').then(function (user) {
            res.view({ title: "Your Addons", breadcrumb: [["/profile", "Your Profile"], ["/profile/addons", "Your Addons"]], activeTab: 'profile.addons', user: user });
        }).catch(function (err) {
            console.error("Error occured during User.findOne inside ProfileController.jobs:", err);
            req.flash('error', "An error occurred. Please try again.");
            res.redirect('/profile');
        });
    },
    settings: function (req, res) {
        User.findOne(req.user.id).then(function (user) {
            res.view({ title: "Your Settings", breadcrumb: [["/profile", "Your Profile"], ["/profile/jobs", "Your Settings"]], activeTab: 'profile.settings', user: user });
        }).catch(function (err) {
            console.error("Error occured during User.findOne inside ProfileController.jobs:", err);
            req.flash('error', "An error occurred. Please try again.");
            res.redirect('/profile');
        });
    },
    jobs: function (req, res) {
        User.findOne(req.user.id).populate('jobs').then(function (user) {
            res.view({ title: "Your Jobs", breadcrumb: [["/profile", "Your Profile"], ["/profile/jobs", "Your Jobs"]], activeTab: 'profile.jobs', user: user });
        }).catch(function (err) {
            console.error("Error occured during User.findOne inside ProfileController.jobs:", err);
            req.flash('error', "An error occurred. Please try again.");
            res.redirect('/profile');
        });
    },
    createAddon: function (req, res) {
        res.view({ title: "Create Addon", subtitle: "Create and Upload a New Addon", breadcrumb: [['/profile', 'Your Profile'], ['/profile/createAddon', 'Create Addon']], activeTab: 'profile.createAddon' });
    }
};
//# sourceMappingURL=ProfileController.js.map