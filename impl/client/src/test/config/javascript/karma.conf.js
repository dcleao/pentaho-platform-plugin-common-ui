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
      "${build.outputDirectory}/web/common-ui-require-js-cfg.js",
      "${build.dependenciesDirectory}/cdf/cdf-require-js-cfg.js",
      "${project.build.directory}/require.config.js",
      "${build.javascriptTestConfigDirectory}/require-test.js",
      "${project.build.directory}/context-end.js",

      {pattern: "${build.dependenciesDirectory}/*/**/*", included: false}, // /target/dependency/
      {pattern: "${build.outputDirectory}/web/**/*", included: false}, // target/test-javascript/
      {pattern: "${build.javascriptTestSourceDirectory}/**/*", included: false} // src/test/javascript/
    ],

    reporters: ["mocha"],

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: true,

    browsers: ["Chrome"]
  });
};
