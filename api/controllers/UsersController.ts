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
						title: user.username,
						activeTab: 'users',
						breadcrumbs: [['/users', 'Users']],
						loadedUser: user
					});
				}
			}).catch(function (err) {
				PrettyError(err, "An error occurred during User.findOne inside UsersController.viewUser");
				req.flash('error', "Something went wrong while trying to view user '" + userId + "', please try again.");
				res.redirect('/users');
			});
	},

	message: function(req, res) {
		var messagedUserId = req.param('user');
		var title = req.param('title');
		var body = req.param('body');

		User.findOne(messagedUserId)
			.then(function(user) {
				if (user === undefined) req.socket.emit('messageResponse', {sent: false, reason: "The user you are trying to message does not exist."});
				else {
					Conversation.create({
						participants: [req.user.id,  messagedUserId],
						title: title
					}).then(function(conversation:Conversation) {
						return conversation.addMessage(req.user, body);
					}).then(function() {
						req.socket.emit('messageResponse', {sent: true, reason: "Your message has been sent."});
					}).catch(function(err) {
						PrettyError(err, "An error occurred during Conversation.create inside UsersController.message");
						req.socket.emit('messageResponse', {sent: false, reason: "Something went wrong while sending your message, please try again."});
					});
				}
			}).catch(function(err) {
				PrettyError(err, "An error occurred during User.findOne inside UsersController.message");
				req.socket.emit('messageResponse', {sent: false, reason: "Something went wrong while looking up the user you were trying to message, please try again."});
			});
	},

	report: function(req, res) {
		var reportedUserId = req.param('user');
		var reason = req.param('reason');
		var body = req.param('body');

		User.findOne(reportedUserId)
		.then(function(user) {
			if (user === undefined) req.socket.emit('reportResponse', {sent: false, reason: "The user you are trying to report does not exist."});
			else {
				Report.create({
					reporter: req.user,
					reported: reportedUserId,
					reason: reason,
					body: body,
					type: Report.Type.USER
				}).then(function(report) {
					req.socket.emit('reportResponse', {sent: true, reason: "Report with ID '" + report.id + "' has been filed. We will review it and get back to you shortly."});
				}).catch(function(err) {
					PrettyError(err, "An error occurred during Report.create inside UsersController.report");
					req.socket.emit('reportResponse', {sent: false, reason: "Something went wrong while filing your report, please try again."});
				});
			}
		}).catch(function(err) {
			PrettyError(err, "An error occurred during User.findOne inside UsersController.report");
			req.socket.emit('reportResponse', {sent: false, reason: "Something went wrong while looking up the user you were trying to report, please try again."});
		});
	}
};

