/// <reference path='../../typings/node/node.d.ts' />

var Transaction = {
    schema: true,
    attributes: {
        sender: {
            model: 'User',
            required: true,
            via: 'Transactions'
        },
        receiver: {
            model: 'User',
            required: true,
            via: 'Transactions'
        },
        senderType: {
            enum: ['donation', 'purchase'],
            required: true
        },
        receiverType: {
            enum: ['income', 'sale'],
            required: true
        },
        rawData: {
            type: 'json',
            required: true
        },

        addon: {
            model: 'Addon',
            required: true,
            via: 'Transactions'
        },

        prettySenderType: function() {
            switch (this.senderType) {
                case 'donation':
                    return 'Donation';
                case 'purchase':
                    return 'Purchase';
            }
        },

        prettyReceiverType: function() {
            switch (this.receiverType) {
                case 'income':
                    return 'Income';
                case 'sale':
                    return 'Sale';
            }
        }
    }
};

module.exports = Transaction;