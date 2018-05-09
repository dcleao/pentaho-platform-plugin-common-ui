(function() {
  "use strict";

  /* globals requireCfg, active_theme, depDir, depWebJars, basePath, baseTest, webjarsSubPath */

  /* eslint dot-notation: 0, require-jsdoc: 0 */

  CONTEXT_PATH = "/";
  var requirePaths = requireCfg.paths;

  requirePaths["dojo"] = depWebJars + "/dojo/${dojo.version}";
  requirePaths["dijit"] = depWebJars + "/dijit/${dojo.version}";
  requirePaths["dojox"] = depDir + "/dojo-release-${dojo.version}-src/dojox";

  // We need to map the original i18n src file to a different amd module
  // so that we can test it, as well use the mock that is need for the test environment
  requirePaths["pentaho/i18n-src"] = basePath + "/pentaho/i18n";
  requirePaths["pentaho/i18n"] = baseTest + "/pentaho/i18nMock";
  requirePaths["pentaho/i18n/MessageBundle"] = basePath + "/pentaho/i18n/MessageBundle";

  requirePaths["common-ui/jquery-clean"] = depDir + "/jqueryClean" + webjarsSubPath +
      "/jquery/${jquery.version}/dist/jquery";

  // Angular
  requirePaths["common-ui/angular"] = depWebJars + "/angular/${angular.version}/angular";

  requirePaths["common-ui/angular-resource"] = depWebJars + "/angular-resource/${angular.version}/angular-resource";

  requirePaths["common-ui/angular-route"] = depWebJars + "/angular-route/${angular.version}/angular-route";

  requirePaths["common-ui/angular-animate"] = depWebJars + "/angular-animate/${angular.version}/angular-animate";
})();
