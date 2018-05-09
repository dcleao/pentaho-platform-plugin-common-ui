module.exports = function(config) {
  config.set({
    basePath: "${basedir}",

    frameworks: ["jasmine", "requirejs"],

    plugins: [
      "karma-jasmine",
      "karma-requirejs",
      "karma-chrome-launcher",
      "karma-mocha-reporter"
    ],

    files: [
      "${project.build.directory}/context-begin.js",
      "${build.javascriptTestOutputDirectory}/web/common-ui-require-js-cfg.js",
      "${build.dependenciesDirectory}/cdf/cdf-require-js-cfg.js",
      "${project.build.directory}/require.config.js",
      "${build.javascriptTestConfigDirectory}/require-test.js",
      "${project.build.directory}/context-end.js",

      {pattern: "${build.dependenciesDirectory}/*/**/*", included: false}, // /target/dependency/
      {pattern: "${build.javascriptTestOutputDirectory}/**/*", included: false}, // target/test-javascript/
      {pattern: "${build.javascriptTestSourceDirectory}/**/*", included: false} // src/test/javascript/
    ],

    exclude: [
      // excluding these two folders because we are using the versions inside the webjars folder
      "${build.dependenciesDirectory}/dojo-release-${dojo.version}-src/(dojo|dijit)/**/*",

      // excluding test files from being included in the dependencies
      "${build.dependenciesDirectory}/**/dojo/tests/**/*",
      "${build.dependenciesDirectory}/*/**/*.+(.spec.js)"
    ],

    reporters: ["mocha"],

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: true,

    browsers: ["Chrome"]
  });
};
