/// <reference path='typings/node/node.d.ts' />

/**
 * modmtn.js
 *
 * Use `modmtn.js` to run your app without `sails lift`.
 * To start the server, run: `node modmtn.js`.
 *
 * This is handy in situations where the sails CLI is not relevant or useful.
 *
 * For example:
 *   => `node modmtn.js`
 *   => `forever start modmtn.js`
 *   => `node debug modmtn.js`
 *   => `modulus deploy`
 *   => `heroku scale`
 *
 *
 * The same command-line arguments are supported, e.g.:
 * `node modmtn.js --silent --port=80 --prod`
 */



  // Load New Relic
require('newrelic');

// Ensure we're in the project directory, so relative paths work as expected
// no matter where we actually lift from.
process.chdir(__dirname);

// Ensure a "sails" can be located:
(function () {
  var sails;
  try {
    sails = require("sails");
  } catch (e) {
    console.error("To run an app using `node modmtn.js`, you usually need to have a version of `sails` installed in the same directory as your app.");
    console.error("To do that, run `npm install sails`");
    console.error("");
    console.error("Alternatively, if you have sails installed globally (i.e. you did `npm install -g sails`), you can use `sails lift`.");
    console.error("When you run `sails lift`, your app will still use a local `./node_modules/sails` dependency if it exists,");
    console.error("but if it doesn't, the app will run with the global sails instead!");
    return;
  }

  // Try to get `rc` dependency
  var rc;
  try {
    rc = require("rc");
  } catch (e0) {
    try {
      rc = require("sails/node_modules/rc");
    } catch (e1) {
      console.error("Could not find dependency: `rc`.");
      console.error("Your `.sailsrc` file(s) will be ignored.");
      console.error("To resolve this, run:");
      console.error("npm install rc --save");
      rc = function () {
        return {};
      };
    }
  }

  //var Cluster = require('cluster');
  //
  //if (Cluster.isMaster) {
  //  var cpuCount = require('os').cpus().length;
  //  console.log("Detected", cpuCount, "CPU cores, spinning up", cpuCount, "workers...");
  //  for (var i = 0; i < cpuCount; i++) {
  //    Cluster.fork();
  //  }
  //
  //  Cluster.on('online', function(worker) {
  //    console.log("Worker", worker.id, "is online");
  //  });
  //  Cluster.on('exit', function(worker) {
  //    console.error("Worker", worker.id, "died, spinning up a new worker...");
  //    Cluster.fork();
  //  });
  //} else {
  //  // Start server
  //  sails.lift(rc("sails"));
  //}

  sails.lift(rc("sails"));
})();
