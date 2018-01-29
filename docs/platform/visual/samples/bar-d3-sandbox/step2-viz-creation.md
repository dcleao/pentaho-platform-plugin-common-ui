---
title: Step 2 - Creating the visualization
description: Walks you through the creation of the Bar visualization class.
parent-path: .
parent-title: Bar/D3 Visualization in Sandbox
grand-parent-title: Create a Custom Visualization
grand-parent-path: ../../create
grand-grand-parent-title: Visualization API
grand-grand-parent-path: ../..
layout: default
---

## Complete Viz code

Create a file named `viz.js` and place the following code in it:

```js
define([
  "module"
], function(module) {

  "use strict";

  return ["pentaho/visual/base/viz", function(BaseViz) {

    var BarViz = BaseViz.extend({
      $type: {
        id: module.id,

        // CSS class (default value)
        //styleClass: "pentaho-visual-samples-bar-d3-viz",

        // The label may show up in menus
        label: "D3 Bar Chart",

        modelTypeId: "./model",
        viewTypeId: "./view-d3"
      }
    });

    return BarViz;
  }];
});
```

Remarks:
  - The _value_ of the AMD module is an array of dependencies and of a factory function 
    of Bar Visualization classes.
  - Defines a visualization whose id is the file's AMD module identifier
    (depending on how AMD is configured, it can be, for example: `pentaho-visual-samples-bar-d3/viz`).
  - Inherits directly from the base visualization class, 
    [pentaho/visual/base/viz]({{site.refDocsUrlPattern | replace: '$', 'pentaho.visual.base.Viz'}}).
  - The [styleClass]({{site.refDocsUrlPattern | replace: '$', 'pentaho.type.Type' | append: '#styleClass'}})
    is useful to style the visualization in container applications using CSS.
  - Specifies the
    [default model type]({{site.refDocsUrlPattern | replace: '$', 'pentaho.visual.base.Viz.Type' | append: '#modelTypeId'}})
    and the 
    [default view type]({{site.refDocsUrlPattern | replace: '$', 'pentaho.visual.base.Viz.Type' | append: '#viewTypeId'}}) 
    to use with this visualization (you'll create both in a moment).

## Register the visualization module

Your visualization must be advertised to the platform so that applications like Analyzer and PDI can offer it to users.
This is done by registering 
the visualization's [`Viz`]({{site.refDocsUrlPattern | replace: '$', 'pentaho.visual.base.Viz'}}) module
with [`pentaho/typeInfo`]({{site.refDocsUrlPattern | replace: '$', 'pentaho.typeInfo'}}),
as a subtype of `pentaho/visual/base/viz`.

For such, edit the `package.json` file and make sure it looks like this:

```json
{
  "name": "pentaho-visual-samples-bar-d3",
  "version": "0.0.1",

  "config": {
    "pentaho/typeInfo": {
      "pentaho-visual-samples-bar-d3/viz": {
        "base": "pentaho/visual/base/viz"
      }
    }
  },

  "dependencies": {
    "d3": "^4.11.0"
  },
  "bundleDependencies": [
    "d3"
  ],
  "devDependencies": {
    "@pentaho/viz-api": "https://github.com/pentaho/pentaho-platform-plugin-common-ui/releases/download/v3.0.0-beta2/pentaho-viz-api-v3.0.0.tgz"
  }
}
```

Note the added `config` property.

## Additional visualization metadata

The visualization class could still be enriched in some ways, such as:

- Providing localized label and description for the name of the visualization.
- Providing standard icons for supported Pentaho themes.

However, these are accessory and can be done at a later stage.
Now you can't wait to see something shining on the screen, 
so let's move on into creating the model and view.

**Continue** to [Creating the model](step3-model-creation).
