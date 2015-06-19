/// <reference path='../typings/node/node.d.ts' />

/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `api/responses/notFound.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#/documentation/concepts/Routes/RouteTargetSyntax.html
 */

module.exports.routes = {

    // Static routes
    'GET    /':                                                 'StaticController.home',
    'GET    /privacyPolicy':                                    'StaticController.privacyPolicy',
    'GET    /termsOfService':                                   'StaticController.termsOfService',
    'GET    /codeOfConduct':                                    'StaticController.codeOfConduct',

    // Profile routes
    'GET    /profile':                                          'ProfileController.purchases',
    'GET    /profile/settings':                                 'ProfileController.settings',
    'POST   /profile/settings':                                 'ProfileController.settingsPOST',
    'GET    /profile/finances':                                 'ProfileController.finances',
    'POST   /profile/finances/withdrawal':                      'ProfileController.withdrawal',
    'GET    /profile/syncSteam':                                'ProfileController.syncSteam',

    'GET    /profile/addons':                                   'ProfileController.addons',
    'GET    /profile/addons/create':                            'ProfileController.createAddon',
    'POST   /profile/addons/create':                            'ProfileController.createAddonPOST',
    'GET    /profile/addons/:id':                               'ProfileController.viewAddon',
    'GET    /profile/addons/:id/edit':                          'ProfileController.editAddon',
    'POST   /profile/addons/:id/edit':                          'ProfileController.editAddonPOST',
    'GET    /profile/addons/:id/remove':                        'ProfileController.removeAddon',
    'GET    /profile/addons/:id/publish':                       'ProfileController.publishAddon',
    'GET    /profile/addons/:id/preview':                       'ProfileController.previewAddon',
    'POST   /profile/addons/:id/coupons':                       'ProfileController.couponsPOST',
    'GET    /profile/addons/:id/coupons/:code/deactivate':      'ProfileController.deactivateCoupon',
    'GET    /profile/notification/:id':                         'ProfileController.notification',
    'POST   /profile/notification/:id':                         'ProfileController.deleteNotification',

    'GET    /profile/messages':                                 'ProfileController.messages',
    'GET    /profile/messages/:id':                             'ProfileController.viewMessage',
    'POST   /profile/messages/:id':                             'ProfileController.respondToMessage',
    'POST   /profile/messages/:id/addUser':                     'ProfileController.addUserToConversation',

    // Staff routes
    'GET    /staff/addons':                                     'StaffController.addons',

    // Public addons routes
    'GET    /addons':                                           'AddonsController.index',
    'GET    /addons/:id':                                       'AddonsController.viewAddon',
    'GET    /addons/:id/download':                              'AddonsController.download',
    'POST   /addons/:id/checkout':                              'AddonsController.checkout',
    'POST   /addons/:id/validateCoupon':                        'AddonsController.validateCoupon',
    'GET    /addons/:id/artwork/:artwork':                      'AddonsController.artwork',
    'POST   /addons/:id/toggleWishlist':                        'AddonsController.toggleWishlist',

	  // Public users routes
	  'GET    /users':                                            'UsersController.index',
	  'POST   /users/message':                                    'UsersController.message',
	  'POST   /users/report':                                     'UsersController.report',
	  'GET    /users/find':                                       'UsersController.find',
    'GET    /users/:id':                                        'UsersController.viewUser',
};
