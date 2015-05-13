module.exports = function (grunt) {
	grunt.registerTask('compileAssets', [
		'clean:dev',
		'jst:dev',
		'less',
		'concat:bootstrap',
		'copy:dev',
		'coffee:dev'
	]);
};
