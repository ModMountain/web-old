/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />

module.exports = {
	_config: {
		actions: false,
		shortcuts: false,
		rest: false
	},

	index: function (req, res) {
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
		var userId = req.param('id');
		User.findOne(userId).populate('addons')
			.then(function (user:User) {
				if (user === undefined) res.notFound();
				else {
					var profilePic = 'https://placeholdit.imgix.net/~text?txtsize=200&txt=?&w=256&h=256';
					if (user.steamProfile.photos[2] !== undefined && user.steamProfile.photos[2] !== null) profilePic = user.steamProfile.photos[2].value;
					res.view({
						title: "User " + user.username,
						activeTab: 'users',
						breadcrumbs: [],
						loadedUser: user,
						profilePic: profilePic
					});
				}
			}).catch(function (err) {
				PrettyError(err, "An error occurred during User.findOne inside UsersController.viewUser");
				req.flash('error', "Something went wrong while trying to view user '" + userId + "', please try again.");
				res.redirect('/users');
			});
	}
};

