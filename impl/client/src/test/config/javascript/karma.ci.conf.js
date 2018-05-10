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
      "${build.outputDirectory}/web/pentaho/**/*.js": ["coverage"],
      "${build.outputDirectory}/web/angular-directives/**/*.js": ["coverage"],
      "${build.outputDirectory}/web/angular-translate/properties-parser.js": ["coverage"],
      "${build.outputDirectory}/web/cache/**/*.js": ["coverage"],
      "${build.outputDirectory}/web/dataapi/**/*.js": ["coverage"],
      "${build.outputDirectory}/web/dojo/pentaho/**/*.js": ["coverage"],
      "${build.outputDirectory}/web/plugin-hanler/**/*.js": ["coverage"],
      "${build.outputDirectory}/web/prompting/**/*.js": ["coverage"],
      "${build.outputDirectory}/web/repo/**/*.js": ["coverage"],
      "${build.outputDirectory}/web/util/*.js": ["coverage"],
      "${build.outputDirectory}/web/vizapi/**/*.js": ["coverage"]
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
