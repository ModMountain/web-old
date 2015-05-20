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
    'GET    /':                             'StaticController.home',

    // Profile routes
    'GET    /profile':                      'ProfileController.index',
    'GET    /profile/settings':             'ProfileController.settings',
    'POST   /profile/settings':             'ProfileController.settingsPOST',

    'GET    /profile/addons':               'ProfileController.addons',
    'GET    /profile/addons/create':        'ProfileController.createAddon',
    'POST   /profile/addons/create':        'ProfileController.createAddonPOST',
    'GET    /profile/addons/:id':           'ProfileController.viewAddon',
    'GET    /profile/addons/:id/edit':      'ProfileController.editAddon',
    'POST   /profile/addons/:id/edit':      'ProfileController.editAddonPOST',
    'GET    /profile/addons/:id/remove':    'ProfileController.removeAddon',
    'GET    /profile/addons/:id/publish':   'ProfileController.publishAddon',

    'GET    /profile/tickets':              'ProfileController.tickets',
    'GET    /profile/tickets/create':       'ProfileController.createTicket',
    'POST   /profile/tickets/create':       'ProfileController.createTicketPOST',
    'POST   /profile/tickets/:id/respond':  'ProfileController.respondPOST',
    'GET    /profile/tickets/:id/close':    'ProfileController.close',

    // Staff routes
    'GET    /staff/addons':                 'StaffController.addons',
    'GET    /staff/tickets':                'StaffController.tickets',
    'GET    /staff/tickets/:id':            'StaffController.viewTicket',
    'POST   /staff/tickets/:id/respond':    'StaffController.respondToTicket',
};
