module.exports = function (grunt) {
	grunt.registerTask('compileAssets', [
		'clean:dev',
		'less',
		'concat',
		'copy:dev',
    'cssmin',
    //'uglify'
    //'purifycss'
	]);
};
