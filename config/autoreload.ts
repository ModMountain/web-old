/// <reference path='../typings/node/node.d.ts' />

module.exports.autoreload = {
	active: true,
	usePolling: false,
	dirs: [
		"api/controllers",
		"api/models",
		"api/policies",
		"api/responses",
		"api/services"
	]
};