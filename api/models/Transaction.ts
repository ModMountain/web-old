/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

var TransactionModel = {
	schema: true,
	attributes: {
		totalAmount: {
			type: 'number',
			required: true
		},
		developerFee: {
			type: 'number'
		},
		paymentMethodFee: {
			type: 'number'
		},
		netAmount: {
			type: 'number',
			required: true
		},
		paymentMethod: {
			type: 'number',
			min: 0,
			required: true
		},
		type: {
			type: 'number',
			min: 0,
			required: true
		},
		status: {
			type: 'number',
			min: 0,
			required: true
		},
		statusReason: {
			type: 'string'
		},
		sender: {
			model: 'User',
			required: true,
			via: 'transactions'
		},
		receiver: {
			model: 'User',
			via: 'transactions'
		},
		addon: {
			model: 'Addon',
			via: 'transactions'
		},
		senderCopy: {
			type: 'boolean',
			required: true
		},
		related: {
			model: 'Transaction',
			via: 'related'
		},
		description: {
			type: 'string',
			required: true
		},
		metadata: {
			type: 'json'
		},

		prettyPaymentMethod: function ():string {
			switch (this.paymentMethod) {
				case Transaction.PaymentMethod.ACCOUNT_BALANCE:
					return 'Account Balance';
					break;
				case Transaction.PaymentMethod.CREDIT_CARD:
					return 'Credit Card';
					break;
				case Transaction.PaymentMethod.PAYPAL:
					return 'PayPal';
					break;
				default:
					return 'Invalid Payment Method'
			}
		},

		prettyStatus: function ():string {
			switch (this.status) {
				case Transaction.Status.PENDING:
					return 'Pending';
					break;
				case Transaction.Status.COMPLETED:
					return 'Completed';
					break;
				case Transaction.Status.FAILED:
					return 'Failed';
					break;
				default:
					return 'Invalid Status'
			}
		},

		prettyType: function ():string {
			switch (this.type) {
				case Transaction.Type.PURCHASE:
					return 'Purchase';
					break;
				case Transaction.Type.WITHDRAWAL:
					return 'Withdrawal';
					break;
				case Transaction.Type.DONATION:
					return 'Donation';
					break;
				default:
					return 'Invalid Type'
			}
		}
	},

	beforeValidate: function(transaction, cb) {
		if (typeof transaction.totalAmount === 'string' || transaction.totalAmount instanceof String) transaction.totalAmount = parseInt(transaction.totalAmount);
		if (typeof transaction.netAmount === 'string' || transaction.netAmount instanceof String) transaction.netAmount = parseInt(transaction.netAmount);
		if (typeof transaction.paymentMethod === 'string' || transaction.paymentMethod instanceof String) transaction.paymentMethod = parseInt(transaction.paymentMethod);
		if (typeof transaction.type === 'string' || transaction.type instanceof String) transaction.type = parseInt(transaction.type);
		if (typeof transaction.status === 'string' || transaction.status instanceof String) transaction.status = parseInt(transaction.status);
		if (typeof transaction.developerFee === 'string' || transaction.developerFee instanceof String) transaction.developerFee = parseInt(transaction.developerFee);
		if (typeof transaction.paymentMethodFee === 'string' || transaction.paymentMethodFee instanceof String) transaction.paymentMethodFee = parseInt(transaction.paymentMethodFee);

		cb();
	}
};

module.exports = TransactionModel;