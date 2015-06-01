/// <reference path='../typings/node/node.d.ts' />

module.exports.autoreload = {
	active: true,
	usePolling: false,
	dirs: [
		"api/models",
		"api/controllers",
		"api/services"
	]
};