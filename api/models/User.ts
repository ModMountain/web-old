/// <reference path='../../typings/node/node.d.ts' />

var User = {
    schema: true,
    attributes: {
        username: {
            type: 'string',
            required: true,
            minLength: 1,
            maxLength: 50
        },
        email: {
            type: 'email'
        },
        steamIdentifier: {
            type: 'string',
            required: true
        },
        steamProfile: {
            type: 'json',
            required: true
        },
        banned: {
            type: 'boolean',
            defaultsTo: false
        },
        permissionLevel: { // 0 is user, 1 is moderator, 2 is administrator
            type: 'integer',
            defaultsTo: 0,
            min: 0,
            max: 2
        },

        //// Associations
        addons: {
            collection: 'Addon',
            via: 'author'
        },
        purchases: {
            collection: 'Addon',
            via: 'purchasers'
        },
        postedJobs: {
            collection: 'Job',
            via: 'poster'
        },
        workJobs: {
            collection: 'Job',
            via: 'worker'
        },
        transactions: {
            collection: 'Transaction',
            via: 'user'
        },
        comments: {
            collection: 'Comment',
            via: 'author'
        },

        // Instance methods
        isModerator: function() {
            return this.permissionLevel >= 1
        },
        isAdministrator: function() {
            return this.permissionLevel >= 2
        }
    }
};

module.exports = User;