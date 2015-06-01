/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

var UserModel = {
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
	    status: {
		    type: 'number',
		    defaultsTo: User.Status.ACTIVE
	    },
        permissionLevel: { // 0 is user, 1 is moderator, 2 is administrator
            type: 'integer',
            defaultsTo: 0,
            min: 0,
            max: 2
        },
        paypalEmail: {
            type: 'email'
        },
        balance: {
            type: 'integer',
            defaultsTo: 0
        },

        // Associations
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
        reviews: {
            collection: 'Review',
            via: 'author'
        },
        reviewComments: {
            collection: 'ReviewComment',
            via: 'author'
        },
        sentTickets: {
            collection: 'Ticket',
            via: 'submitter'
        },
        receivedTickets: {
            collection: 'Ticket',
            via: 'handler'
        },
        sentTransactions: {
            collection: 'Transaction',
            via: 'sender'
        },
        receivedTransactions: {
            collection: 'Transaction',
            via: 'receiver'
        },

        // Instance methods
        isModerator: function () {
            return this.permissionLevel >= 1
        },
        isAdministrator: function () {
            return this.permissionLevel >= 2
        }
    }
};

module.exports = UserModel;