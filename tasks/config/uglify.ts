/**
 * Minify files with UglifyJS.
 *
 * ---------------------------------------------------------------
 *
 * Minifies client-side javascript `assets`.
 *
 * For usage docs see:
 * 		https://github.com/gruntjs/grunt-contrib-uglify
 *
 */
module.exports = function(grunt) {

	grunt.config.set('uglify', {
		dist: {
			cwd: '.tmp/public/',
			src: '**/*.js',
			dest: '.tmp/public/',
			expand: true,
			flatten: true
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
};
