module.exports = function (grunt) {
	grunt.registerTask('compileAssets', [
		'clean:dev',
		'less',
		'concat:bootstrap',
		'copy:dev',
    //'purifycss'
	]);
};
