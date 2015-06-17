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
					breadcrumbs: true,
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
          var cleanAddons = [];
          user.addons.forEach((addon) => {if (addon.status === Addon.Status.PUBLISHED) cleanAddons.push(addon)});
          user.addons = cleanAddons;

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
		var messagedUserId = req.param('users');
		var title = req.param('title');
		var body = req.param('body');

    var usersToFind = messagedUserId.split(',').map((id) => User.findOne(id));

    Promise.all(usersToFind)
    .then(function(users:Array<User>) { //FIXME sending user gets a notif about the message they sent (redundant)
        for (var i = 0; i < users.length; i++) {
          if (users[i] === undefined) {
            if (req.isSocket) {
              return req.socket.emit('messageResponse', {sent: false, reason: "The user you are trying to message does not exist."});
            } else {
              req.flash('error', "The user you are trying to message does not exist.");
              res.redirect('/profile/messages')
            }
          }
        }
        var participants = users;
        participants.push(req.user.id);
        Conversation.create({
          participants: participants,
          title: title
        }).then(function(conversation:Conversation) {
          return [conversation, conversation.addMessage(req.user, body)];
        }).spread(function(conversation) {
          users.forEach(function(user) {
            NotificationService.sendUserNotification(user, Notification.Priority.LOW, req.user.username + ' has sent you a message', '/profile/messages/' + conversation.id)
          });
          if (req.isSocket) {
            req.socket.emit('messageResponse', {sent: true, reason: ""});
          } else {
            req.flash('success', "Your message has been sent.");
            res.redirect('/profile/messages/' + conversation.id)
          }
        }).catch(function(err) {
          PrettyError(err, "An error occurred during Conversation.create inside UsersController.message");
          if (req.isSocket) {
            return req.socket.emit('messageResponse', {sent: false, reason: "Something went wrong while sending your message, please try again."});
          } else {
            req.flash('error', "Something went wrong while sending your message, please try again.");
            res.redirect('/profile/messages')
          }
        });
      });

		User.findOne(messagedUserId)
			.then(function(user) {
				if (user === undefined) req.socket.emit('messageResponse', {sent: false, reason: "The user you are trying to message does not exist."});
				else {

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
	},

  find: function(req, res) {
    User.find(req.allParams()).then(function(users) {
      users = _.map(users, function(user) {
        return {
          id: user.id,
          username: user.username,
          avatar: user.steamProfile.photos[2].value
        }
      });
      res.json(users);
    })
  }
};

