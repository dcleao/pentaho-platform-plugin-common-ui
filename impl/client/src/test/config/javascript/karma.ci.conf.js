var baseConfig = require("./karma.conf.js");

module.exports = function(config) {
  baseConfig(config);

  config.set({

    basePath: "${basedir}",

    frameworks: ["jasmine", "requirejs"],

    plugins: [
      "karma-jasmine",
      "karma-requirejs",
      "karma-junit-reporter",
      "karma-html-reporter",
      "karma-coverage",
      "karma-phantomjs-launcher"
    ],

    reporters: ["progress", "junit", "coverage"],

    preprocessors: {
      src: [
      "${build.outputDirectory}/web/pentaho/**/*.js",
      "${build.outputDirectory}/web/angular-directives/**/*.js",
      "${build.outputDirectory}/web/angular-translate/properties-parser.js",
      "${build.outputDirectory}/web/cache/**/*.js",
      "${build.outputDirectory}/web/dataapi/**/*.js",
      "${build.outputDirectory}/web/dojo/pentaho/**/*.js",
      "${build.outputDirectory}/web/plugin-handler/**/*.js",
      "${build.outputDirectory}/web/prompting/**/*.js",
      "${build.outputDirectory}/web/repo/**/*.js",
      "${build.outputDirectory}/web/util/*.js",
      "${build.outputDirectory}/web/vizapi/**/*.js"
      ],
      dest: ["coverage"]
    },

    junitReporter: {
      useBrowserName: false,
      outputFile: "${build.javascriptReportDirectory}/test-results.xml",
      suite: "unit"
    },

    coverageReporter: {
      useBrowserName: false,
      reporters: [
        {
          type: "html",
          dir: "${build.javascriptReportDirectory}/jscoverage/html/"
        },
        {
          type: "cobertura",
          dir: "${build.javascriptReportDirectory}/cobertura/xml/"
        }
      ],
      dir: "${build.javascriptReportDirectory}"
    },

    logLevel: config.LOG_INFO,

    autoWatch: false,

    browsers: ["PhantomJS"],

    singleRun: true
  });
};
