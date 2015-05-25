/// <reference path='../../typings/node/node.d.ts' />

var Promise = require('bluebird');
module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: false
    },

    home: function(req, res) {
        Promise.join(Tag.find().sort({totalAddons: 'desc'}).limit(3), Addon.find({featured: true, status: 'published'}).limit(4), Addon.find().sort({createdAt: 'asc', status: 'published'}).limit(10))
        .then(function(array) {
                res.view({title: 'Mod Mountain', activeTab: 'home', popularTags: array[0], featuredAddons: array[1], latestAddons: array[2]});
            });
    }
};

