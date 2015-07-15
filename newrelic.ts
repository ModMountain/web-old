/// <reference path='typings/node/node.d.ts' />

var app_name = 'Mod Mountain - Development';
if (process.env.NODE_ENV.toUpperCase() === 'PRODUCTION') app_name = 'Mod Mountain - Production';

exports.config = {
  app_name: app_name,
  license_key: '***REMOVED***',
  capture_params: true,
  logging: {
    level: 'trace',
    filepath: require('path').join(process.cwd(), 'newrelic_agent.log'),
    enabled: true
  },
  error_collector: {
    enabled: true,
    ignore_status_codes: [404, 403]
  },
  rules: {
    ignore: ['^/socket.io/*/xhr-polling', '^/assets/*']
  },
  browser_monitoring: {
    enable: false,
  },
};
