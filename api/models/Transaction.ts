/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

var TransactionModel = {
    schema: true,
    attributes: {
        sender: {
            model: 'User',
            required: true,
            via: 'Transactions'
        },
        receiver: {
            model: 'User',
            required: false,
            via: 'Transactions'
        },
        senderType: {
            enum: ['donation', 'purchase', 'withdrawal'],
            required: true
        },
        receiverType: {
            enum: ['income', 'sale', 'withdrawal'],
            required: true
        },
	    amount: {
		    type: 'number',
		    required: true
	    },
        stripeData: {
            type: 'json'
        },
	    inProgress: {
		    type: 'boolean',
		    defaultsTo: false
	    },
	    paypalId: {
		    type: 'string'
	    },
	    paypalExecuteUrl: {
		    type: 'string'
	    },
	    couponCode: {
		    type: 'string'
	    },
        addon: {
            model: 'Addon',
            required: false,
            via: 'Transactions'
        },

        prettySenderType: function () {
            switch (this.senderType) {
                case 'donation':
                    return 'Donation';
                case 'purchase':
                    return 'Purchase';
	            case 'withdrawal':
		            return 'Withdrawal';
            }
        },
        prettyReceiverType: function () {
            switch (this.receiverType) {
                case 'income':
                    return 'Income';
                case 'sale':
                    return 'Sale';
	            case 'withdrawal':
		            return 'Withdrawal';
            }
        }
    },

	beforeValidate: function(transaction, cb) {
		if (typeof transaction.amount === 'string') transaction.amount = parseInt(transaction.amount);
		cb();
	}
};

module.exports = TransactionModel;