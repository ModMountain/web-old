/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

var Stripe = require("stripe")(sails.config.stripe.secretKey);

var Service = {
	accountBalancePayment: function (amount:number, type:Transaction.Type, sender:User, receiver:User, description:String, metadata:Object, addon?:Addon):Promise<any> {
		var senderNetAmount = amount;
		var developerFee = amount * 0.10;
		var paymethodMethodFee = 0;
		var receiverNetAmount = amount - developerFee - paymethodMethodFee;

		if (sender.balance - senderNetAmount < 0) return Promise.reject(Transaction.FailReason.INSUFFICIENT_FUNDS);

		sender.balance -= senderNetAmount;
		receiver.balance += receiverNetAmount;
		return Promise.join(
			Transaction.create({
				totalAmount: amount,
				netAmount: senderNetAmount,
				paymentMethod: Transaction.PaymentMethod.ACCOUNT_BALANCE,
				type: type,
				status: Transaction.Status.COMPLETED,
				sender: sender,
				receiver: receiver,
				senderCopy: true,
				addon: addon,
				description: description,
				metadata: metadata
			}),
			Transaction.create({
				totalAmount: amount,
				developerFee: developerFee,
				paymentMethodFee: paymethodMethodFee,
				netAmount: receiverNetAmount,
				paymentMethod: Transaction.PaymentMethod.ACCOUNT_BALANCE,
				type: type,
				status: Transaction.Status.COMPLETED,
				sender: sender,
				receiver: receiver,
				senderCopy: false,
				addon: addon,
				description: description,
				metadata: metadata
			}),
			function (senderTransaction:Transaction, receiverTransaction:Transaction) {
				sender.transactions.add(senderTransaction);
				receiver.transactions.add(receiverTransaction);
				return [sender.save(), receiver.save()];
			}
		).catch(
			function (err) {
				PrettyError(err, "Error inside PaymentService.accountBalancePayment");
				return Promise.reject(Transaction.FailReason.GENERAL_ERROR);
			}
		);
	},

	creditCardPayment: function (amount:number, type:Transaction.Type, sender:User, receiver:User, description:String, metadata:Object, addon?:Addon):Promise<any> {
		var senderNetAmount = amount;
		var developerFee = amount * 0.10;
		var paymethodMethodFee = 30 + (amount * 0.029); // https://stripe.com/ca/pricing
		var receiverNetAmount = amount - developerFee - paymethodMethodFee;

		return Stripe.charges.create({
			amount: senderNetAmount,
			currency: 'USD',
			source: metadata.token,
			description: description
		}).then(function (charge) {
			receiver.balance += receiverNetAmount;
			return Promise.join(
				Transaction.create({
					totalAmount: amount,
					netAmount: senderNetAmount,
					paymentMethod: Transaction.PaymentMethod.CREDIT_CARD,
					type: type,
					status: Transaction.Status.COMPLETED,
					sender: sender,
					receiver: receiver,
					senderCopy: true,
					addon: addon,
					description: description,
					metadata: metadata
				}),
				Transaction.create({
					totalAmount: amount,
					developerFee: developerFee,
					paymentMethodFee: paymethodMethodFee,
					netAmount: receiverNetAmount,
					paymentMethod: Transaction.PaymentMethod.CREDIT_CARD,
					type: type,
					status: Transaction.Status.COMPLETED,
					sender: sender,
					receiver: receiver,
					senderCopy: false,
					addon: addon,
					description: description,
					metadata: metadata
				}),
				function (senderTransaction:Transaction, receiverTransaction:Transaction) {
					sender.transactions.add(senderTransaction);
					receiver.transactions.add(receiverTransaction);
					return [sender.save(), receiver.save()];
				}
			).catch(
				function (err) {
					PrettyError(err, "Error inside PaymentService.creditCardPayment");
					return Promise.reject({
						reason: Transaction.FailReason.GENERAL_ERROR
					});
				}
			)
		}).catch(function (err) {
			if (err.type === 'StripeCardError') return Promise.reject(Transaction.FailReason.CARD_DECLINED);
			else {
				PrettyError(err, "Error inside PaymentService.creditCardPayment");
				return Promise.reject(Transaction.FailReason.GENERAL_ERROR);
			}
		});
	},

	paypalPayment: function (amount:number, type:Transaction.Type, sender:User, receiver:User, description:String, metadata:Object, addon?:Addon):Promise<any> {

	}
};

module.exports = Service;