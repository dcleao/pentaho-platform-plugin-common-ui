define([
  "pentaho/visual/base/modelFactory",
  "pentaho/i18n!model"
  //"./theme/model"
], function(visualFactory, bundle) {

  "use strict";

  /**
   * Creates the `Calc` type of a given context.
   *
   * @name calcFactory
   * @memberOf pentaho.visual.samples
   * @type pentaho.type.Factory
   * @amd pentaho/visual/samples/calc
   */
  return function(context) {

    var Visual = context.get(visualFactory);

    return Visual.extend({
      meta: {
        id: "pentaho/visual/samples/calcNew",
        v2Id: "sample_calc",

        view: "View", // relative to declaring type's `id` unless prefixed with '/'. When type is anonymous, it's global?
        styleClass: "pentaho-visual-samples-calculator",
        props: [
          {
            name: "levels",
            type: ["string"],
            required: true
          },
          {
            name: "measure",
            //type: {
            //  base: "role",
            //  otherTypes: ["number"]
            //},
            required: true
          },
          {
            name: "operation",
            type: {
              base: "refinement",
              of:   "string",
              facets: "DiscreteDomain",
              domain: ["min", "max", "avg", "sum"]
            },
            value: "min"
          }
        ]
      }
    })
    .implement({meta: bundle.structured});
  };
});
