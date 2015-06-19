/// <reference path='../../../typings/node/node.d.ts' />
/// <reference path='../../../typings/modmountain/modmountain.d.ts' />

var path = require('path');
module.exports = function (sails) {

  return {

    /**
     * Default configuration
     *
     * We do this in a function since the configuration key for
     * the hook is itself configurable, so we can't just return
     * an object.
     */
    defaults: {

      __configKey__: {
        // Set Auto-reload to be active by default
        active: true,
        //use polling to watch file changes
        //slower but sometimes needed for VM environments
        usePolling: false,
        // Set dirs to watch
        dirs: [
          path.resolve(sails.config.appPath, 'api', 'controllers'),
          path.resolve(sails.config.appPath, 'api', 'hooks'),
          path.resolve(sails.config.appPath, 'api', 'models'),
          path.resolve(sails.config.appPath, 'api', 'policies'),
          path.resolve(sails.config.appPath, 'api', 'responses'),
          path.resolve(sails.config.appPath, 'api', 'services')
        ],

        chokidar: {
          ignoreInitial: true,
          usePolling: false,
          ignored: /\.ts|\.map/
        }
      }
    },

    /**
     * Initialize the hook
     * @param  {Function} cb Callback for when we're done initializing
     */
    initialize: function (cb) {

      // If the hook has been deactivated, just return
      if (!sails.config[this.configKey].active) {
        sails.log.verbose("Auto-reload hook deactivated.");
        return cb();
      }

      var Chokidar = require('chokidar');

      Chokidar.watch(path.resolve(sails.config.appPath, 'api', 'controllers'), sails.config[this.configKey].chokidar)
        .on('all', sails.util.debounce(function (action, path, stats) {
        sails.log.info("Detected controller change, reloading controllers...");

        sails.hooks.controllers.loadAndRegisterControllers(function () {
          sails.router.flush();
          sails.hooks.blueprints.bindShadowRoutes();
        });
      }, 100));

      Chokidar.watch(path.resolve(sails.config.appPath, 'api', 'models'), sails.config[this.configKey].chokidar)
        .on('all', sails.util.debounce(function (action, path, stats) {
        sails.log.info("Detected model change, reloading ORM...");

        sails.hooks.orm.reload();
      }, 100));

      Chokidar.watch(path.resolve(sails.config.appPath, 'api', 'services'), sails.config[this.configKey].chokidar)
        .on('all', sails.util.debounce(function (action, path, stats) {
        sails.log.info("Detected service change, reloading services...");

        sails.hooks.services.loadModules();
      }, 100));

      // We're done initializing.
      return cb();
    }
  };
};
