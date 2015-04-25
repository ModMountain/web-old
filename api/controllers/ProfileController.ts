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
        res.view({title: "Your Profile", breadcrumbs: [["/profile", "Your profile"]], activeTab: 'profile.index'});
    },

    addons: function (req, res) {
        User.findOne(req.user.id)
            .populate('addons')
            .then(function (user) {
                res.view({
                    title: "Your Addons",
                    breadcrumbs: [["/profile", "Your Profile"], ["/profile/addons", "Your Addons"]],
                    activeTab: 'profile.addons',
                    user: user
                })
            }).catch(function (err) {
                console.error("An error occurred during User.findOne inside ProfileController.addons:", err);
                req.flash('error', "An error occurred. Please try again.");
                res.redirect('/profile');
            });
    },

    settings: function (req, res) {
        User.findOne(req.user.id)
            .then(function (user) {
                res.view({
                    title: "Your Settings",
                    breadcrumbs: [["/profile", "Your Profile"], ["/profile/jobs", "Your Settings"]],
                    activeTab: 'profile.settings',
                    user: user
                })
            }).catch(function (err) {
                console.error("An error occurred during User.findOne inside ProfileController.settings:", err);
                req.flash('error', "An error occurred. Please try again.");
                res.redirect('/profile');
            });
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
        User.findOne(req.user.id)
            .populate('jobs')
            .then(function (user) {
                res.view({
                    title: "Your Jobs",
                    breadcrumbs: [["/profile", "Your Profile"], ["/profile/jobs", "Your Jobs"]],
                    activeTab: 'profile.jobs',
                    user: user
                })
            }).catch(function (err) {
                console.error("An error occurred during User.findOne inside ProfileController.jobs:", err);
                req.flash('error', "An error occurred. Please try again.");
                res.redirect('/profile');
            });
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
            filePath: 'TODO', //TODO put something useful here
            description: req.body.description,
            instructions: req.body.instructions,
            explanation: req.body.explanation,
            outsideServers: (req.body.outsideServers !== undefined),
            containsDrm: (req.body.containsDrm !== undefined),
            // Media tab
            bannerPath: 'TODO', //TODO put something useful here
            galleryImagePaths: 'TODO', //TODO put something useful here
            youtubeVideos: 'TODO',//req.body.youtubeVideos, //TODO put something useful here
            // Special features tab
            autoUpdaterEnabled: (req.body.autoUpdaterEnabled !== undefined),
            configuratorEnabled: (req.body.configuratorEnabled !== undefined),
            leakProtectionEnabled: (req.body.leakProtectionEnabled !== undefined),
            statTrackerEnabled: (req.body.statTrackerEnabled !== undefined),
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
            req.socket.emit('createAddon.success');
        }).catch(function (err) {
            console.error("An error occurred during Addon.create inside ProfileController.createAddonPOST:", err);
            req.socket.emit('error', {
                type: "Database Error",
                message: "Something went wrong while submitting your addon. Please try again."
            });
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
    }
};

