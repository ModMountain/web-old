module.exports = function (grunt) {
	grunt.registerTask('development', [
		'compileAssets',
    'watch'
	]);
};
