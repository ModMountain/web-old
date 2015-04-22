module.exports = function (grunt) {
    grunt.registerTask('linkAssetsBuildProd', [
        'sails-linker:prodJsRelative',
        'sails-linker:prodStylesRelative',
        'sails-linker:devTpl',
        'sails-linker:prodJsRelativeJade',
        'sails-linker:prodStylesRelativeJade',
        'sails-linker:devTplJade'
    ]);
};
//# sourceMappingURL=linkAssetsBuildProd.js.map