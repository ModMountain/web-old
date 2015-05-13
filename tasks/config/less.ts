/**
 * Compiles LESS files into CSS.
 *
 * ---------------------------------------------------------------
 *
 * Only the `assets/styles/importer.less` is compiled.
 * This allows you to control the ordering yourself, i.e. import your
 * dependencies, mixins, variables, resets, etc. before other stylesheets)
 *
 * For usage docs see:
 * 		https://github.com/gruntjs/grunt-contrib-less
 */
module.exports = function(grunt) {

	grunt.config.set('less', {
		bootstrapCore: {
			options: {
				strictMath: true
			},
			src: 'assets/plugins/bootstrap-3.3.4./less/bootstrap.less',
			dest: '.tmp/public/bootstrap.css'
		},

		dev: {
			files: [{
				expand: true,
				cwd: 'assets/less/',
				src: ['**/*.less'],
				dest: '.tmp/public/css/',
				ext: '.css'
			}]
		}
	});

	grunt.loadNpmTasks('grunt-contrib-less');
};
