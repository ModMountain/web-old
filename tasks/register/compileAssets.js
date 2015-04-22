module.exports = function (grunt) {
    grunt.registerTask('compileAssets', [
        'clean:dev',
        'jst:dev',
        'less:dev',
        'copy:dev',
        'coffee:dev'
    ]);
};
//# sourceMappingURL=compileAssets.js.map