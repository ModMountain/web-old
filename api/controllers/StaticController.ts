/// <reference path='../../typings/node/node.d.ts' />

module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: false
    },

    home: function(req, res) {
        res.view({title: 'Mod Mountain', activeTab: 'home'});
    }
};

