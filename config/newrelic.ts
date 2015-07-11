/// <reference path='../typings/node/node.d.ts' />

var app_name = 'Mod Mountain - Development';
if (process.env.NODE_ENV.toUpperCase() === 'PRODUCTION') app_name = 'Mod Mountain - Production';

module.exports.newrelic = {
	app_name: app_name,
	license_key: '***REMOVED***',
	logging: {
		level: 'trace', // can be error, warn, info, debug or trace
		rules: {
			ignore: ['^/socket.io/*/xhr-polling', '^/assets/*']
		}
	},
	capture_params: true,
	browser_monitoring: {
		enable: false
	}
};
