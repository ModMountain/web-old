/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

var BadgeService = {
	chargeFee: function (user) {
		var firstOfMonth:Date = new Date();
		firstOfMonth.setDate(1);
		firstOfMonth.setHours(0);
		firstOfMonth.setMinutes(0);
		firstOfMonth.setSeconds(0);

		Transaction.count({
			senderType: 'purchase',
		}).where({createdAt: {'>=': firstOfMonth}})
			.then(function(total) {
				if (total === 1) {
					return Transaction.create({
						sender: user,
						amount: 10 * 100,
						senderType: 'devfee',
						receiverType: 'devfee'
					}).then(function() {
						user.balance -= 10 * 100;
						return user.save()
					})
				}
			}).catch(function(err) {
				PrettyError(err, "Something went wrong while charging a fee");
			});
	}
};

module.exports = BadgeService;