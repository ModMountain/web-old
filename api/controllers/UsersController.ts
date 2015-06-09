/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />

var NewRelic = require('newrelic');

module.exports = {
	_config: {
		actions: false,
		shortcuts: false,
		rest: false
	},

	index: function (req, res) {
		NewRelic.setControllerName('UsersController.index');
		User.find()
			.then(function (users) {
				res.view({
					title: "Users",
					activeTab: 'users',
					breadcrumbs: [],
					users: users
				});
			});
	},

	viewUser: function (req, res) {
		NewRelic.setControllerName('UsersController.viewUser');
		var userId = req.param('id');
		User.findOne(userId).populate('addons')
			.then(function (user:User) {
				if (user === undefined) res.notFound();
				else {
					res.view({
						title: "User " + user.username,
						activeTab: 'users',
						breadcrumbs: [],
						loadedUser: user
					});
				}
			}).catch(function (err) {
				PrettyError(err, "An error occurred during User.findOne inside UsersController.viewUser");
				req.flash('error', "Something went wrong while trying to view user '" + userId + "', please try again.");
				res.redirect('/users');
			});
	}
};

