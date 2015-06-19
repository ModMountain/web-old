module.exports = function(grunt) {
	grunt.config.set('purifycss', {
    dev: {
      src: ['views/**/*.html', '.tmp/public/**/*.js'],
      css: ['.tmp/public/**/*.css'],
      dest: '.tmp/public/styles.css'
    }
	});

	grunt.loadNpmTasks('grunt-purifycss');
};
