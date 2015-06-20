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
      files: [{
        cwd: '.tmp/public/',
        src: '**/*.js',
        dest: '.tmp/public/',
        expand: true,
        ext: '.js'
      }],
      options: {

      }
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
};
