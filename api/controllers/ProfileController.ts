/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />

var NewRelic = require('newrelic');
var SanitizeHTML = require('sanitize-html');

module.exports = {
  _config: {
    actions: false,
    shortcuts: false,
    rest: false
  },

  purchases: function (req, res) {
    NewRelic.setControllerName('ProfileController.purchases');
    User.findOne(req.user.id).populate('purchases')
      .then(function (user) {
        res.locals.user = _.merge(res.locals.user, user);
        req.user = _.merge(req.user, user);

        return Promise.all(_.map(req.user.purchases, function (purchase) {
          return Addon.findOne(purchase.id).populate('author');
        }))
      }).then(function (populatedPurchases) {
        req.user.purchases = populatedPurchases;
        res.view({
          title: "Purchases",
          activeTab: 'profile.purchases',
          breadcrumbs: true
        });
      }).catch(function (error) {
        PrettyError(error, "Error occurred during ProfileController.purchases");
        req.flash('error', "Something went wrong while displaying your purchases, please try again.");
        res.redirect('/');
      });
  },

  addons: function (req, res) {
    NewRelic.setControllerName('ProfileController.addons');
    User.findOne(req.user.id).populate('addons')
      .then(function (user) {
        res.locals.user = _.merge(res.locals.user, user);
        req.user = _.merge(req.user, user);

        return Promise.all(_.map(req.user.addons, (addon) => {
          return Addon.findOne(addon.id).populate('purchasers')
        }));
      }).then(function (addons) {
        req.user.addons = addons;
        res.view({
          title: "Addons",
          breadcrumbs: [["/profile", "Profile"]],
          activeTab: 'profile.addons'
        })
      }).catch(function (error) {
        PrettyError(error, "Error occurred during ProfileController.addons");
        req.flash('error', "Something went wrong while displaying your addons, please try again.");
        res.redirect('/profile');
      });
  },

  settings: function (req, res) {
    NewRelic.setControllerName('ProfileController.settings');
    res.view({
      title: "Settings",
      breadcrumbs: [["/profile", "Profile"]],
      activeTab: 'profile.settings'
    })
  },

  settingsPOST: function (req, res) {
    NewRelic.setControllerName('ProfileController.settingsPOST');
    var oldEmail = req.user.email;

    if (req.body.username !== undefined && req.body.username !== '') req.user.username = req.body.username;
    req.user.email = req.body.primaryEmail;
    req.user.paypalEmail = req.body.paypalEmail;
    req.user.bio = req.body.bio;

    if (req.body.social_facebook) req.user.social.facebook = req.body.social_facebook;
    if (req.body.social_skype) req.user.social.skype = req.body.social_skype;
    if (req.body.social_youtube) req.user.social.youtube = req.body.social_youtube;
    if (req.body.social_email) req.user.social.email = req.body.social_email;

    req.user.save()
      .then(function () {
        // If the user updated their email, invite them to Slack
        if (oldEmail !== req.user.email) SlackService.inviteUserToSlack(req.user);

        req.flash('success', "Your settings have been updated.");
        res.redirect('/profile/settings');
      }).catch(function (err) {
        PrettyError(err, 'An error occurred during User.update inside ProfileController.settingsPOST');
        req.flash('error', "Something went wrong while we were updating your settings. Please try again.");
        res.redirect('/profile/settings')
      })
  },

  createAddon: function (req, res) {
    NewRelic.setControllerName('ProfileController.createAddon');
    Tag.getPopularTags()
      .then(function (tags) {
        res.view({
          title: "Create Addon",
          subtitle: "Create and Upload a New Addon",
          breadcrumbs: [['/profile', 'Profile']],
          activeTab: 'profile.createAddon',
          popularTags: tags
        });
      }).catch(function (err) {
        PrettyError(err, "An error occurred inside ProfileController.createAddon");
        req.flash("error", "Something went wrong, please try again");
        res.redirect("/profile");
      });
  },

  createAddonPOST: function (req, res) {
    NewRelic.setControllerName('ProfileController.createAddonPOST');
    if (req.files.zipFile === undefined) {
      req.flash('error', 'You must attach a file with your addon!');
      res.redirect('/profile/addons/create');
    } else if (req.body.price < 0) {
      req.flash('error', 'You cannot enter a negative price!');
      res.redirect('/profile/addons/create');
    } else if (req.body.explanation === undefined) {
      req.flash('error', 'You must provide an explanation with your addon!');
      res.redirect('/profile/addons/create');
    } else if (req.body.rawTags === undefined) {
      req.flash('error', 'You must specify tags with your addon!');
      res.redirect('/profile/addons/create');
    } else if (req.files.galleryImages === undefined || req.files.cardImage === undefined) {
      req.flash('error', 'You must provide a card image and at least 3 gallery images with your addon!');
      res.redirect('/profile/addons/create');
    } else if (!Array.isArray(req.files.galleryImages) || req.files.galleryImages.length < 3) {
      req.flash('error', 'You must provide at least 3 gallery images!');
      res.redirect('/profile/addons/create');
    } else {
      var bannerImage = '';
      if (req.files.bannerImage !== undefined) bannerImage = req.files.bannerImage[0].objectId.toString();

      var galleryImages = _.map(req.files.galleryImages, function (file) {
        return file.objectId.toString();
      });

      Addon.create({
        // General tab
        name: req.body.name,
        price: parseFloat(req.body.price) * 100,
        gamemode: req.body.gamemode,
        type: req.body.type,
        zipFile: req.files.zipFile[0].objectId.toString(),
        size: req.files.zipFile[0].size,
        youtubeLink: req.body.youtubeLink,
        shortDescription: req.body.shortDescription,
        description: req.body.description,
        instructions: req.body.instructions,
        explanation: req.body.explanation,
        outsideServers: (req.body.outsideServers !== undefined),
        containsDrm: (req.body.containsDrm !== undefined),
        // Associations
        author: req.session.passport.user,
        rawTags: req.body.rawTags,
        galleryImages: galleryImages,
        cardImage: req.files.cardImage[0].objectId.toString(),
        bannerImage: bannerImage
      }).then(function (addon) {
        return [addon, User.findOne(req.session.passport.user).populate('addons')];
      }).spread(function (addon, user) {
        user.addons.add(addon);
        return [addon, user.save()]
      }).spread(function (addon) {
        sails.log.verbose("New addon was submitted and is awaiting approval:", addon);
        req.flash('success', "Addon '" + addon.name + "' has been submitted and is now waiting approval.");
        res.redirect('/profile/addons/' + addon.id)
      }).catch(function (err) {
        PrettyError(err, 'An error occurred during Addon.create inside ProfileController.createAddonPOST');
        req.flash('error', 'Something went wrong while submitting your addon. Please try again.');
        res.redirect('/profile/addons/create');
      });
    }
  },

  viewAddon: function (req, res) {
    NewRelic.setControllerName('ProfileController.viewAddon');
    var addonId = req.param('id');
    Addon.findOne(addonId)
      .then(function (addon:Addon) {
        if (addon === undefined) {
          res.notFound();
        } else if (!addon.canModify(req.user)) {
          res.forbidden();
        } else {
          res.view({
            title: addon.name,
            subtitle: "Viewing Addon '" + addon.name + "'",
            breadcrumbs: [['/profile', 'Profile'], ['/profile/addons', 'Addons']],
            activeTab: 'profile.addons',
            addon: addon
          });
        }
      }).catch(function (err) {
        PrettyError(err, 'An error occurred during Addon.findOne inside ProfileController.viewAddon');
        req.flash('error', "Something went wrong while trying to view addon '" + addonId + "', please try again");
        res.redirect('/profile/addons')
      });
  },

  editAddon: function (req, res) {
    NewRelic.setControllerName('ProfileController.editAddon');
    var addonId = req.param('id');
    Addon.findOne(addonId)
      .then(function (addon:Addon) {
        if (addon === undefined) {
          res.notFound();
        } else if (!addon.canModify(req.user)) {
          res.forbidden();
        } else {
          Tag.getPopularTags()
            .then(function (tags) {
              res.view({
                title: "Edit Addon",
                subtitle: "Editing Addon '" + addon.name + "'",
                breadcrumbs: [['/profile', 'Profile'], ['/profile/addons', 'Addons'], ['/profile/addons/' + addonId, addon.name]],
                activeTab: 'profile.addons',
                addon: addon,
                popularTags: tags
              })
            });
        }
      }).catch(function (err) {
        PrettyError(err, 'An error occurred inside ProfileController.editAddon');
        req.flash('error', "Something went wrong while trying to edit addon '" + addonId + "', please try again");
        res.redirect('/profile/addons/' + addonId);
      });
  },

  editAddonPOST: function (req, res) {
    NewRelic.setControllerName('ProfileController.editAddonPOST');
    var addonId = req.param('id');
    Addon.findOne(addonId)
      .then(function (addon:Addon) {
        if (addon === undefined) {
          res.notFound();
        } else if (!addon.canModify(req.user)) {
          res.forbidden();
        } else {
          req.body.outsideServers = req.body.outsideServers !== undefined;
          req.body.containsDrm = req.body.containsDrm !== undefined;
          req.body.status = Addon.Status.PENDING;
          if (req.files.zipFile !== undefined) {
            req.body.zipFile = req.files.zipFile[0].objectId.toString();
            req.body.size = req.files.zipFile[0].size;
          }

          if (req.files.bannerImage !== undefined) {
            req.body.bannerImage = req.files.bannerImage[0].objectId.toString();
          }
          if (req.files.cardImage !== undefined) {
            req.body.cardImage = req.files.cardImage[0].objectId.toString();
          }
          if (req.files.galleryImages !== undefined) {
            req.body.galleryImages = _.map(req.files.galleryImages, function (file) {
              return file.objectId.toString();
            });
          }

          if (req.body.price) {
            req.body.price = parseFloat(req.body.price) * 100;
          }

          var oldStatus = addon.status;
          Addon.update(addonId, req.body)
            .then(function () {
              if (oldStatus === Addon.Status.PUBLISHED) {
                addon.decrementTags(function () {
                  req.flash('success', "Addon " + addonId + " updated successfully");
                })
              } else {
                req.flash('success', "Addon " + addonId + " updated successfully");
              }
            })
            .catch(function (err) {
              req.flash('error', "Something went wrong while trying to update addon " + addonId);
              PrettyError(err, 'An error occurred during Addon.update inside ProfileController.editAddonPOST')
            }).finally(function () {
              res.redirect('/profile/addons/' + addonId);
            })
        }
      }).catch(function (err) {
        PrettyError(err, 'An error occurred during Addon.findOne inside ProfileController.editAddonPOST');
        req.flash('error', "Something went wrong while trying to update addon '" + addonId + "', please try again");
        res.redirect('/profile/addons/' + addonId);
      });
  },

  removeAddon: function (req, res) {
    NewRelic.setControllerName('ProfileController.removeAddon');
    var addonId = req.param('id');
    Addon.findOne(addonId)
      .then(function (addon:Addon) {
        if (addon === undefined) {
          res.notFound();
        } else if (!addon.canModify(req.user)) {
          res.forbidden();
        } else {
          return Addon.destroy(addonId)
        }
      }).then(function () {
        req.flash('success', "Addon '" + addonId + "' removed successfully");
      }).catch(function (err) {
        PrettyError(err, 'An error occurred during Addon.findOne inside ProfileController.removeAddon');
        req.flash('error', "Something went wrong while trying to remove addon '" + addonId + "', please try again");
      }).finally(function () {
        res.redirect('/profile/addons/');
      })
  },

  publishAddon: function (req, res) {
    NewRelic.setControllerName('ProfileController.publishAddon');
    var addonId = req.param('id');
    Addon.findOne(addonId)
      .then(function (addon:Addon) {
        if (addon === undefined) {
          res.notFound();
        } else if (!addon.canModify(req.user)) {
          res.forbidden();
        } else {
          if (addon.status === Addon.Status.APPROVED) {
            addon.status = Addon.Status.PUBLISHED;
            addon.save()
              .then(function () {
                addon.incrementTags(function () {
                  req.flash('success', "Addon '" + addon.name + "' has been published");
                  res.redirect('/profile/addons/' + addonId);
                });
              });
          } else {
            req.flash('error', "You cannot publish an addon that is not approved.");
            res.redirect('/profile/addons/' + addonId);
          }
        }
      }).catch(function (err) {
        PrettyError(err, 'An error occurred during Addon.findOne inside ProfileController.publishAddon');
        req.flash('error', "Something went wrong while trying to publish addon " + addonId);
        res.redirect('/profile/addons/' + addonId);
      });
  },

  previewAddon: function (req, res) {
    NewRelic.setControllerName('ProfileController.previewAddon');
    var addonId = req.param('id');
    Addon.findOne(addonId)
      .then(function (addon:Addon) {
        if (addon === undefined) {
          res.notFound();
        } else if (!addon.canModify(req.user)) {
          res.forbidden();
        } else {
          res.view('addons/viewaddon', {
            title: "Preview " + addon.name,
            activeTab: 'profile.addons',
            noTitleCrumb: true,
            breadcrumbs: [['/profile', 'Profile'], ['/profile/addons', 'Addons'], ['/profile/addons/' + addonId, addon.name], 'Preview'],
            addon: addon
          })
        }
      }).catch(function (err) {
        PrettyError(err, 'An error occurred during Addon.findOne inside ProfileController.previewAddon');
        req.flash('error', "Something went wrong while trying to preview addon " + addonId);
        res.redirect('/profile/addons/' + addonId);
      });
  },

  messages: function (req, res) {
    NewRelic.setControllerName('ProfileController.messages');
    User.findOne(req.user.id).populate('conversations')
      .then(function (user) {
        res.locals.user = _.merge(res.locals.user, user);
        req.user = _.merge(req.user, user);

        return Promise.all(_.map(req.user.conversations, function (conversation) {
          return Conversation.findOne(conversation.id).populateAll();
        }));
      }).then(function (conversations) {
        req.user.conversations = conversations;
        req.user.conversations.forEach(function (conversation) {
          // Clean up the participants
          var usernameMap = {};
          conversation.participants = conversation.participants.map(function (participant) {
            usernameMap[participant.id] = participant.username;
            return participant.username;
          });
          conversation.participants.join(', ');

          // Set the last reply
          conversation.lastReply = conversation.messages[conversation.messages.length - 1];
          conversation.lastReply.username = usernameMap[conversation.lastReply.user];
        });

        res.view({
          title: "Messages",
          subtitle: "Read and Reply to Your Messages",
          breadcrumbs: [['/profile', 'Profile']],
          activeTab: 'profile.messages'
        });
      });
  },

  viewMessage: function (req, res) {
    NewRelic.setControllerName('ProfileController.viewMessage');
    var conversationId = req.param('id');
    Conversation.findOne(conversationId).populate('participants')
      .then(function (conversation:Conversation) {
        if (conversation === undefined) {
          res.notFound();
        } else if (!conversation.isParticipant(req.user)) {
          res.forbidden();
          // If this is a socket talking to us, just subscribe them instead of giving them a view
        } else if (req.isSocket) {
          Conversation.subscribe(req.socket, conversationId);
        } else {
          var usernameMap = {};
          conversation.participants.forEach(function (participant:User) {
            usernameMap[participant.id] = participant;
          });

          conversation.messages = conversation.messages.map(function (message) {
            message.avatar = usernameMap[message.user].steamProfile.photos[2].value;
            message.username = usernameMap[message.user].username;
            return message;
          });

          res.view({
            title: conversation.title,
            breadcrumbs: [['/profile', 'Profile'], ['/profile/messages', "Messages"]],
            activeTab: 'profile.messages',
            conversation: conversation
          })
        }
      }).catch(function (err) {
        PrettyError(err, "Error occurred during Conversation.findOne inside ProfileController.viewMessage");
        req.flash('error', "Something went wrong, please try again");
        res.redirect('/profile/messages');
      });
  },

  respondToMessage: function (req, res) {
    var conversationId = req.param('id');
    var body = SanitizeHTML(req.param('body'), {
      allowedTags: ['b', 'i', 'em', 'strong', 'a'],
      allowedAttributes: {
        'a': ['href']
      }
    });

    if (body === '') {
      return req.socket.emit('messageResponse', {sent: false, reason: "Failed to add response, please try again"});
    }

    Conversation.findOne(conversationId).populate('participants')
      .then(function (conversation:Conversation) {
        if (conversation === undefined) {
          res.notFound();
        } else if (!conversation.isParticipant(req.user)) {
          res.forbidden();
        } else {
          conversation.addMessage(req.user, body)
            .then(function (message:ConversationMessage) {
              Conversation.publishUpdate(conversation.id, {
                type: 'newResponse',
                username: req.user.username,
                user: req.user.id,
                avatar: req.user.steamProfile.photos[2].value,
                body: body,
                date: message.date.toDateString()
              });
              req.socket.emit('messageResponse', {sent: true});
            }).catch(function (err) {
              PrettyError(err, "Error occurred during Conversation.addMessage inside ProfileController.viewMessage");
              req.socket.emit('messageResponse', {sent: false, reason: "Failed to add response, please try again"});
            });
        }
      }).catch(function (err) {
        PrettyError(err, "Error occurred during Conversation.findOne inside ProfileController.viewMessage");
        req.socket.emit('messageResponse', {sent: false, reason: "Failed to lookup message, please try again"});
      });
  },

  addUserToConversation: function (req, res) {
    var conversationId = req.param('id');
    var userToAdd = req.param('user');

    Conversation.findOne(conversationId).populate('participants')
      .then(function (conversation:Conversation) {
        if (conversation === undefined) {
          res.notFound();
        } else if (!conversation.isParticipant(req.user)) {
          res.forbidden();
        } else {
          User.findOne(userToAdd)
            .then(function (user:User) {
              if (user === undefined) {
                req.socket.emit('addUserResponse', {sent: false, reason: "That user does not exist"});
              } else if (conversation.isParticipant(user)) {
                req.socket.emit('addUserResponse', {
                  sent: false,
                  reason: user.username + " is already in this conversation"
                });
              } else {
                conversation.participants.add(user);
                conversation.addMessage(req.user, req.user.username + " has added " + user.username + " to the conversation")
                  .then(function (message:ConversationMessage) {
                    Conversation.publishUpdate(conversation.id, {
                      type: 'newResponse',
                      username: req.user.username,
                      user: req.user.id,
                      avatar: req.user.steamProfile.photos[2].value,
                      body: message.body,
                      date: message.date.toDateString()
                    });
                    req.socket.emit('messageResponse', {sent: true});
                  }).catch(function (err) {
                    PrettyError(err, "Error occurred during Conversation.addMessage inside ProfileController.viewMessage");
                    req.socket.emit('messageResponse', {
                      sent: false,
                      reason: "Failed to add response, please try again"
                    });
                  });
              }
            });
        }
      }).catch(function (err) {
        PrettyError(err, "Error occurred during Conversation.findOne inside ProfileController.viewMessage");
        req.socket.emit('messageResponse', {sent: false, reason: "Failed to lookup message, please try again"});
      });
  },

  finances: function (req, res) {
    NewRelic.setControllerName('ProfileController.finances');
    var populatePromiseArray = [];
    req.user.transactions.forEach(function (transaction) {
      populatePromiseArray.push(Transaction.findOne(transaction.id).populate('sender').populate('receiver').populate('addon'));
    });

    Promise.all(populatePromiseArray)
      .then(function (populatedTransactions) {
        req.user.transactions = populatedTransactions;
        res.view({
          title: 'Finances',
          breadcrumbs: [["/profile", "Profile"]],
          activeTab: 'profile.finances'
        })
      });

  },

  withdrawal: function (req, res) {
    NewRelic.setControllerName('ProfileController.withdrawal');
    var amount = req.param('amount') * 100;
    if (amount <= 10) {
      req.flash('error', "You cannot withdraw any less than $10");
      res.redirect('/profile/finances');
    } else if (req.user.balance - amount < 0) {
      req.flash('error', "Your balance is not sufficient enough to withdraw $" + amount / 100);
      res.redirect('/profile/finances');
    } else {
      Transaction.create({
        sender: req.user,
        senderType: 'withdrawal',
        receiverType: 'withdrawal',
        amount: amount,
        inProgress: true,
      }).then(function (transaction) {
        req.user.balance -= amount;
        return req.user.save();
      }).then(function () {
        req.flash('success', "Request received, we will contact you soon to complete the process.");
        res.redirect('/profile/finances');
      }).catch(function (err) {
        PrettyError(err, "An error occurred during Transaction.create or user.save inside ProfileController.withdrawal");
        req.flash('error', "Something went wrong, please try again.");
        res.redirect('/profile/finances');
      });
    }
  },

  syncSteam: function (req, res) {
    NewRelic.setControllerName('ProfileController.syncSteam');
    req.user.steamProfile = {};
    req.user.save()
      .then(function () {
        req.logout();
        res.redirect('/auth/login');
      });
  },

  couponsPOST: function (req, res) {
    NewRelic.setControllerName('ProfileController.couponsPOST');
    var addonId = req.param('id');

    var code:String = req.param('code');
    var amount:Number = parseInt(req.param('amount'));
    var type:Number = parseInt(req.param('type'));

    if (amount === undefined || code === undefined || type === undefined) { // If they forgot to enter a parameter
      req.flash('error', "You failed to completely fill out the coupon form, please try again.");
      res.redirect('/profile/addons/' + addonId);
    } else if (amount <= 0 || amount >= 100) { // If the amount is invalid
      req.flash('error', 'You entered an invalid amount, please try again.');
      res.redirect('/profile/addons/' + addonId);
    } else if (code.length > 16) { // If the length of the code is too long
      req.flash('error', 'The maximum coupon code length is 16 characters, please try again.');
      res.redirect('/profile/addons/' + addonId);
    } else if (type !== 0 && type !== 1) { // If the type is invalid
      req.flash('error', 'You have specified an invalid coupon type, please try again.');
      res.redirect('/profile/addons/' + addonId);
    } else {
      Addon.findOne(addonId).populate('tags').populate('reviews').populate('purchasers')
        .then(function (addon:Addon) {
          if (addon === undefined) {
            res.notFound();
          } else if (!addon.canModify(req.user)) {
            res.forbidden();
          } else if (addon.couponExists(code)) {
            req.flash('error', "You have already created a coupon with that code.");
            res.redirect('/profile/addons/' + addonId);
          } else {
            code = code.toUpperCase();
            return addon.addCoupon(code, amount, type)
          }
        })
        .then(function () {
          req.flash('success', "Coupon '" + code + "' has been created.");
          res.redirect('/profile/addons/' + addonId)
        });
    }
  },

  deactivateCoupon: function (req, res) {
    NewRelic.setControllerName('ProfileController.deactivateCoupon');
    var addonId = req.param('id');
    var code:String = req.param('code');

    Addon.findOne(addonId)
      .then(function (addon:Addon) {
        if (addon === undefined) {
          res.notFound();
        } else if (!addon.canModify(req.user)) {
          res.forbidden();
        } else if (!addon.couponExists(code)) {
          req.flash('error', "That coupon does not exist.");
          res.redirect('/profile/addons/' + addonId);
        } else if (!addon.isValidCoupon(code)) {
          req.flash('error', "That coupon has already expired.");
          res.redirect('/profile/addons/' + addonId);
        } else {
          return addon.deactivateCoupon(code);
        }
      })
      .then(function () {
        req.flash('success', "Coupon '" + code + "' has been deactivated.");
        res.redirect('/profile/addons/' + addonId)
      });
  },

  notification: function (req, res) {
    NewRelic.setControllerName('ProfileController.notification');
    var notificationId = req.param('id');
    Notification.findOne({id: notificationId, user: req.user.id})
      .then(function (notification:Notification) {
        if (notification === undefined) {
          req.flash('warning', "You've already read that notification");
          res.redirect('/profile');
        } else {
          notification.destroy().then(() => res.redirect(notification.link)).catch(function (err) {
            PrettyError(err, "An error occurred during notification.destroy inside ProfileController.notification");
            req.flash('error', 'Something went wrong, please try again');
            res.redirect('/profile');
          })
        }
      }).catch(function (err) {
        PrettyError(err, "An error occurred during Notification.findOne inside ProfileController.notification");
        req.flash('error', 'Something went wrong, please try again');
        res.redirect('/profile');
      })
  },

  deleteNotification: function (req, res) {
    NewRelic.setControllerName('ProfileController.deleteNotification');
    var notificationId = req.param('id');
    Notification.destroy({id: notificationId, user: req.user.id})
      .catch((err) => PrettyError(err, "Error occurred during Notification.destroy inside ProfileController.deleteNotification"))
  }
};

