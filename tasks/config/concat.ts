/**
 * Concatenate files.
 *
 * ---------------------------------------------------------------
 *
 * Concatenates files javascript and css from a defined array. Creates concatenated files in
 * .tmp/public/contact directory
 * [concat](https://github.com/gruntjs/grunt-contrib-concat)
 *
 * For usage docs see:
 * 		https://github.com/gruntjs/grunt-contrib-concat
 */
module.exports = function(grunt) {

	grunt.config.set('concat', {
		bootstrap: {
			src: [
				'assets/plugins/bootstrap-3.3.4/js/transition.js',
				'assets/plugins/bootstrap-3.3.4/js/alert.js',
				'assets/plugins/bootstrap-3.3.4/js/button.js',
				'assets/plugins/bootstrap-3.3.4/js/carousel.js',
				'assets/plugins/bootstrap-3.3.4/js/collapse.js',
				'assets/plugins/bootstrap-3.3.4/js/dropdown.js',
				'assets/plugins/bootstrap-3.3.4/js/modal.js',
				'assets/plugins/bootstrap-3.3.4/js/tooltip.js',
				'assets/plugins/bootstrap-3.3.4/js/popover.js',
				'assets/plugins/bootstrap-3.3.4/js/scrollspy.js',
				'assets/plugins/bootstrap-3.3.4/js/tab.js',
				'assets/plugins/bootstrap-3.3.4/js/affix.js'
			],
			dest: '.tmp/public/plugins/bootstrap-3.3.4/js/bootstrap.js'
		}
	});

	grunt.loadNpmTasks('grunt-contrib-concat');
};
