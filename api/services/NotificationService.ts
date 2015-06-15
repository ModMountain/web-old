/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />

var Mailgun = require('mailgun').Mailgun;
var mg = new Mailgun('***REMOVED***');
var Swig = require('swig');
var MailComposer = require('mailcomposer').MailComposer;

var Service = {
  sendGlobalNotification: function (priority:Notification.Priority, message:string, link:string) {
    User.find().then(function (users:Array<User>) {
        users.forEach(function (user) {
          NotificationService.sendUserNotification(user, priority, message, link);
        })
      });
  },

  sendUserNotification: function (user:User, priority:Notification.Priority, message:string, link:string) {
    // Users can opt to not receive certain notifications
    if (priority < user.notificationIgnoreLevel) return;

    Notification.create({
      user: user, priority: priority, message: message, link: link
    }).then(function (notification) {
      // Don't try sending an email if the user has no email specified
      if (user.email === undefined || user.email === null) return;

      // Use Swig to compile the email template to HTML
      Swig.renderFile(process.cwd() + '/views/emails/notification.swig.html', {
        priority: priority, priorityColor: "#ff0000", body: message
      }, function (swigError, output) {
        if (swigError) return PrettyError(swigError, "Swig compilation error");
        // Create the raw MIME email that Mailgun will send
        var msg = new MailComposer();
        msg.addHeader('x-mailer', 'ModMountain 1.0');
        msg.setMessageOption({
          from: "Mod Mountain <admin@modmountain.com>",
          to: user.email,
          subject: 'Mod Mountain Notification',
          html: output
        });
        // Compile the message and then send it off
        msg.buildMessage(function (msgCompileError, compiledMessage) {
          if (msgCompileError) return PrettyError(msgCompileError, "MailComposer error");
          mg.sendRaw('admin@modmountain.com', user.email, compiledMessage, function (mailgunError) {
            if (mailgunError) return PrettyError(mailgunError, "Something went wrong while sending a notification")
          });
        });
      });
    }).catch(function (error) {
      PrettyError(error, "Something went wrong while calling Notification.create inside NotificationService.sendUserNotification:")
    });
  }
};

module.exports = Service;
