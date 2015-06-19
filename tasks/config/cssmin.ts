/**
 * Compress CSS files.
 *
 * ---------------------------------------------------------------
 *
 * Minifies css files and places them into .tmp/public/min directory.
 *
 * For usage docs see:
 * 		https://github.com/gruntjs/grunt-contrib-cssmin
 */
module.exports = function(grunt) {

	grunt.config.set('cssmin', {
		//dist: {
		//	cwd: '.tmp/public/',
		//	src: '**/*.css',
		//	dest: '.tmp/public/',
		//	expand: true,
		//	flatten: true
		//}
    dist: {
      files: [{
        src: '.tmp/public/styles.css',
        dest: '.tmp/public/styles.css'
      }],
      options: {
        keepSpecialComments: 0
      }
    }
	});

	grunt.loadNpmTasks('grunt-contrib-cssmin');
};
