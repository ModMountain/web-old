/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />
var Needle = require('needle');

var BadgeService = {
	inviteUserToSlack: function(user) {
		var url = 'https://' + sails.config.slack.communityName + '.slack.com/api/users.admin.invite?t=' + Date.now();
		var data = {
			email: user.email,
			channels: "C051QDDUU,C051QDJJN",
			first_name: user.username,
			token: sails.config.slack.token,
			set_active: true
		};
		Needle.post(url, data, function(err, resp) {
			if (err) PrettyError(err, "An error occurred while inviting a user to slack:")
		});
	}
};

module.exports = BadgeService;