/// <reference path='../../typings/node/node.d.ts' />
/// <reference path='../../typings/modmountain/modmountain.d.ts' />
/// <reference path='../../typings/bluebird/bluebird.d.ts' />

var NewRelic = require('newrelic');
var SanitizeHTML = require('sanitize-html');
var QS = require('querystring');

module.exports = {
  _config: {
    actions: false,
    shortcuts: false,
    rest: false
  },

  //TODO fix this mess of a function
  liveEdit: function (req, res) {
    NewRelic.setControllerName('ProfileController.liveEdit');
    if (req.session.addonEditor === undefined) req.session.addonEditor = {};

    if (req.param('id')) {
      var addonId = req.param('id');
      Addon.findOne(addonId).populateAll()
      .then(function(addon:Addon) {
          if (addon === undefined) res.notFound();
          else if (!addon.canModify(req.user)) res.forbidden();
          else {
            if (req.session.addonEditor[addonId] === undefined) req.session.addonEditor[addonId] = addon;
            return req.session.save(function() {
              res.view({
                title: "Addon Editor",
                addon: req.session.addonEditor[addonId],
                activeTab: 'profile.addons',
                breadcrumbs: [["/profile", "Profile"], ["/addons", "Addons"]],
              });
            });
          }
        }).catch(function(err) {
          PrettyError(err, "Something went wrong during liveEdit")
          res.serverError();
        });
    } else {
      // Stick default addon into session
      if (req.session.addonEditor.new === undefined) {
        req.session.addonEditor.new = {
          id: 'new',
          author: req.user.id,
          name: "New Addon",
          price: 0,
          shortDescription: "This is your addon's short description. It will be displayed various places around the site. Keep it short and concise.",
          description: "This is your addon's full description. Feel free to use Markdown so things look pretty!",
          rawTags: "some, sample, tags",
          activeTab: 'profile.liveedit',
          images: [],
          videos: [],
          versions: [],
          events: []
        };
        return req.session.save(function(err) {
          if (err) res.serverError();
          else {
            res.view({
              title: "Addon Editor",
              addon: req.session.addonEditor.new,
              activeTab: 'profile.addons',
              breadcrumbs: [["/profile", "Profile"], ["/addons", "Addons"]],
            });
          }
        });
      }

      res.view({
        title: "Addon Editor",
        addon: req.session.addonEditor.new,
        activeTab: 'profile.addons',
        breadcrumbs: [["/profile", "Profile"], ["/addons", "Addons"]],
      });
    }
  },

  //TODO fix this mess of a function
  liveEditPOST: function (req, res) {
    NewRelic.setControllerName('ProfileController.liveEditPOST');
    var objToUpdate;
    if (req.param('id')) objToUpdate = req.session.addonEditor[req.param('id')];
    else objToUpdate = req.session.addonEditor.new;

    var type = req.param('type');

    // A field has been updated
    if (type === 'update') {
      var field = req.param('field');

      if (field === 'image') {
        var action = req.param('action').toUpperCase();

        if (action === "NEW") {
          var objectId = req.files.file[0].objectId;
          objToUpdate.images.push({
            objectId: objectId,
            originalId: objectId,
            type: Addon.Image.Type.NORMAL
          });
          // Save the session and respond with the index of this image
          req.session.save(() => res.json({
            objectId: objectId,
            originalId: objectId,
            type: Addon.Image.Type.NORMAL
          }));
        } else if (action === "REMOVE") {
          // Get the ID of the image the user wants to remove
          var originalId = req.param('originalId');
          // Iterate over all images in the session
          for (var i = 0; i < objToUpdate.images.length; i++) {
            var image = objToUpdate.images[i];
            // If the current image is a match
            if (image.originalId === originalId) {
              // Remove it from the session and from GridFS
              objToUpdate.images.splice(i, 1);
              Promise.join(req.session.save(), FileService.removeFile(image.originalId), FileService.removeFile(image.originalId))
                .then(() => req.socket.emit('actionResponse', {action: 'remove', originalId: originalId}))
                .catch(function (err) {
                  PrettyError(err, "An error occurred while removing an image");
                  res.serverError();
                });
              // Break the loop early
              break;
            }
          }
        } else if (action === "MODIFY") {
          var originalId = req.param('originalId');
          var desiredType = req.param('desiredType');
          // Iterate over all images in the session
          for (var i = 0; i < objToUpdate.images.length; i++) {
            var image = objToUpdate.images[i];

            // Ensure we don't  have duplicate cards or banners
            if (desiredType === Addon.Image.Type.CARD && image.type === Addon.Image.Type.CARD) image.type = Addon.Image.Type.NORMAL;
            if (desiredType === Addon.Image.Type.BANNER && image.type === Addon.Image.Type.BANNER) image.type = Addon.Image.Type.NORMAL;

            // If the current image is a match
            if (image.originalId === originalId) {
              image.type = desiredType;
              if (desiredType === Addon.Image.Type.NORMAL) {
                // Lazily remove the old image
                FileService.removeOldImage(image);
                image.objectId = image.originalId;
                req.session.save(function(err) {
                  if (err) {
                    PrettyError(err, "An error occurred while modifying an image");
                    res.serverError();
                  } else {
                    req.socket.emit('actionResponse', {
                      action: 'modify',
                      objectId: image.objectId,
                      originalId: originalId,
                      type: desiredType
                    });
                  }
                });
                break;
              } else {
                FileService.modifyImage(image, desiredType)
                  .then(function (newId) {
                    // Lazily remove the old image
                    FileService.removeOldImage(image);
                    image.objectId = newId;
                    return req.session.save();
                  }).then(function () {
                    req.socket.emit('actionResponse', {
                      action: 'modify',
                      objectId: image.objectId,
                      originalId: originalId,
                      type: desiredType
                    });
                  }).catch(function (err) {
                    PrettyError(err, "An error occurred while modifying an image");
                    res.serverError();
                  });
                if (desiredType === Addon.Image.Type.HIGHLIGHT) break;
              }
            }
          }
        }
      } else if (field === 'video') {
        var action = req.param('action').toUpperCase();
        if (action === "NEW") {
          var value = req.param('value');

          // Must validate the URl we were given
          // Every Youtube url contains "watch?", we need its location to validate and find the URL parameters
          var watchIndex = value.indexOf("watch?");
          if (watchIndex <= 0) {
            return req.socket.emit('updateResponse', {
              error: true,
              type: "Youtube Error",
              msg: "The URL you specified was not a valid Youtube URL."
            })
          }

          // Now that we know this a Youtube URL, we need to extract the paramets from it
          var params = QS.parse(value.substr(watchIndex + 6));
          var videoId = params.v;

          for (var i = 0; i < objToUpdate.videos.length; i++) {
            if (objToUpdate.videos[i].id === videoId) {
              return req.socket.emit('updateResponse', {
                error: true,
                type: "Youtube Error",
                msg: "You have already added that video."
              });
            }
          }

          objToUpdate.videos.push({
            id: videoId,
            provider: Addon.Video.Provider.YOUTUBE,
            type: Addon.Video.Type.NORMAL
          });
          req.session.save(() => req.socket.emit('updateResponse', {error: false, type: 'video', id: videoId}));
        } else if (action === "REMOVE") {
          var id = req.param('originalId');
          for (var i = 0; i < objToUpdate.videos.length; i++) {
            if (objToUpdate.videos[i].id === id) {
              objToUpdate.videos.splice(i, 1);
              return req.session.save(() => req.socket.emit('actionResponse', {action: 'remove', id: id}))
            }
          }
        } else if (action === "MODIFY") {
          var id = req.param('originalId');
          var desiredType = req.param('desiredType');
          for (var i = 0; i < objToUpdate.videos.length; i++) {
            var video = objToUpdate.videos[i];
            if (video.id === id) {
              video.type = desiredType;
              return req.session.save(() => req.socket.emit('actionResponse', {action: 'modify', id: id}))
            }
          }
        }
      } else if (field === "price") {
        var value = req.param('value');
        if (value.substr(0,1) === "$") value = parseFloat(value.substr(1, value.length));
        objToUpdate[field] = value * 100;
        req.session.save();
      } else if (field === 'event') {
        var action = req.param('action');
        if (action === 'new') {
          var eventName = req.param('value');
          if (objToUpdate.events === undefined) objToUpdate.events = [];

          for (var i = 0; i < objToUpdate.length; i++) {
            if (objToUpdate.events[i] === eventName) {
              return req.socket.emit('eventActionResponse', {
                err: true,
                type: "Event Error",
                msg: "An event with that name already exists"
              })
            }
          }

          objToUpdate.events.push(eventName);
          req.session.save(() =>
            req.socket.emit('eventActionResponse', {
              name: eventName,
              count: 0,
              action: action
            })
          );
        } else if (action === 'remove') {
          var eventName = req.param('value');

          for (var i = 0; i < objToUpdate.events.length; i++) {
            if (objToUpdate.events[i] === eventName) {
              objToUpdate.events.splice(i, 1);
              return req.session.save(() =>
                  req.socket.emit('eventActionResponse', {
                    name: eventName,
                    action: action
                  })
              )
            }
          }

          return req.socket.emit('eventActionResponse', {
            err: true,
            type: "Event Error",
            msg: "Event not found"
          })
        } else {
          req.socket.emit('eventActionResponse', {
            err: true,
            type: "Action Error",
            msg: "Invalid action '" + action + "'"
          });
        }
      } else if (field === 'version') {
        var action = req.param('action').toUpperCase();
        if (action === 'NEW') {
          var versionNumber = req.param('versionNumber');
          var versionFile = req.files.versionFile[0].objectId;
          objToUpdate.versions.push({
            number: versionNumber,
            downloads: 0,
            createdAt: Date.now(),
            approved: false,
            size: req.files.versionFile[0].size,
            file: versionFile
          });
          req.session.save(function() {
            res.redirect(req.path);
          })
        }
      } else {
        objToUpdate[field] = req.param('value');
        req.session.save();
      }
    } else if (type === 'finalize') {
      // Figure out the banner and card images
      objToUpdate.cardImage = undefined;
      objToUpdate.bannerImage = undefined;
      for (var i = 0; i < objToUpdate.images.length; i++) {
        var image = objToUpdate.images[i];
        if (image.type === Addon.Image.Type.CARD) objToUpdate.cardImage = image.objectId;
        else if (image.type === Addon.Image.Type.BANNER) objToUpdate.bannerImage = image.objectId;
      }

      // Make sure the addon will validate
      if (!objToUpdate.cardImage) return req.socket.emit('finalizeResponse', {error: true, type: "Validation Error", msg: "Your addon must have a card image."});
      if (objToUpdate.images.length < 3) return req.socket.emit('finalizeResponse', {error: true, type: "Validation Error", msg: "Your add must have at least 3 images."});

      var promise;
      if (objToUpdate.id === 'new') {
        promise = Addon.create(objToUpdate);
        console.log("Creating a new addon")
      }
      else {
        promise = Addon.update(objToUpdate.id, objToUpdate);
        console.log("Updating an existing addon")
      }
      promise
        .then(function (addon) {
          // Chunk of code to generate promises that will add AddonVersions to the database
          //var makeAddonVersionPromises = [];
          //objToUpdate.versions.forEach(function(version) {
          //  if (version.updatedAt) {
          //    delete version.downloads; // In case people downloaded the addon while it was being edited
          //    makeAddonVersionPromises.push(AddonVersion.update({addon: objToUpdate, number: version.number}, version));
          //  } else {
          //    delete version.createdAt;
          //    version.addon = addon.id;
          //    makeAddonVersionPromises.push(AddonVersion.create(version));
          //  }
          //});

          // Set the obj to undefined to flush this addonEditor data out of the session store
          req.session.addonEditor[objToUpdate.id] = undefined;
          //return [addon, Promise.all(makeAddonVersionPromises), req.session.save()];
          return [addon, req.session.save()];
        }).spread(function (addon) {
          console.log("There are", addon.versions.length, "versions")
          req.socket.emit('finalizeResponse', {error: false, addonId: addon.id || addon[0].id});
        }).catch(function (error) {
          req.socket.emit('finalizeResponse', {error: true, type: "Finalization Error", msg: "Something went wrong while finalizing your addon, please try again."});
          PrettyError(error, "Something went wrong while finalizing an addon")
          //console.error(error)
        })
    }
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

