/// <reference path='../typings/node/node.d.ts' />

/**
 * View Engine Configuration
 * (sails.config.views)
 *
 * Server-sent views are a classic and effective way to get your app up
 * and running. Views are normally served from controllers.  Below, you can
 * configure your templating language/framework of choice and configure
 * Sails' layout support.
 *
 * For more information on views and layouts, check out:
 * http://sailsjs.org/#/documentation/concepts/Views
 */

module.exports.views = {

  engine: {
    ext: 'swig.html',
    fn: function(pathName, locals, cb) {
      var Swig = require('swig');
      var swigInstance = new Swig.Swig({
        cache: sails.config.templateCache,
        loader: Swig.loaders.fs(process.cwd() + '/views')
      });
      var extras = require('swig-extras');
      extras.useFilter(swigInstance, 'nl2br');
      extras.useFilter(swigInstance, 'markdown');
      extras.useTag(swigInstance, 'markdown');
      return swigInstance.renderFile(pathName, locals, cb);
    }
  },

  layout: false,

  /****************************************************************************
  *                                                                           *
  * Partials are simply top-level snippets you can leverage to reuse template *
  * for your server-side views. If you're using handlebars, you can take      *
  * advantage of Sails' built-in `partials` support.                          *
  *                                                                           *
  * If `false` or empty partials will be located in the same folder as views. *
  * Otherwise, if a string is specified, it will be interpreted as the        *
  * relative path to your partial files from `views/` folder.                 *
  *                                                                           *
  ****************************************************************************/

  partials: false


};
