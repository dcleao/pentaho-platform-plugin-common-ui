/*!
 * Copyright 2018 Hitachi Vantara. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define([
  "module",
  "pentaho/util/text",
  "pentaho/util/error",
  "pentaho/i18n!viz"
], function(module, text, error, bundle) {

  "use strict";

  return [
    "pentaho/type/complex",
    "pentaho/visual/base/model",
    "pentaho/visual/base/view",
    function(Complex, Model, View) {

      /**
       * @name pentaho.visual.base.Viz.Type
       * @class
       * @extends pentaho.type.Complex.Type
       *
       * @classDesc The type class of {@link pentaho.visual.base.Viz}.
       */

      /**
       * @name Viz
       * @memberOf pentaho.visual.base
       * @class
       * @extends pentaho.type.Complex
       *
       * @amd {pentaho.type.spec.UTypeModule<pentaho.visual.base.Viz>} pentaho/visual/base/viz
       *
       * @classDesc The `Viz` class is the abstract base class of visualizations.
       *
       * This type represents a visualization as a pair of
       * a [Model]{@link pentaho.visual.base.Model} and
       * a [View]{@link pentaho.visual.base.View} and
       * is expected to represent the user facing concept of a visualization.
       *
       * The only requirement to render a "visualization", is a compatible `Model` and `View` pair.
       * This type exists to centralize user interface information about a visualization and
       * to make some common use cases easier.
       * Container applications will typically consume registered `Viz` types.
       *
       * The type should be provided with metadata such as
       * [label]{@link pentaho.visual.base.Viz.Type#label},
       * [description]{@link pentaho.visual.base.Viz.Type#description} and
       * [styleClass]{@link pentaho.visual.base.Viz.Type#styleClass}
       * that makes it suitable for offering the visualization to the user in a User Interface,
       * without loading the associated `Model` and `View` types.
       *
       * The `Model` and `View` pair is specified in a weak-typing fashion,
       * upon defining a `Viz` type,
       * through the type attributes
       * [modelTypeId]{@link pentaho.visual.base.Viz.Type#modelTypeId},
       * [viewTypeId]{@link pentaho.visual.base.Viz.Type#viewTypeId},
       * respectively.
       * These are *not* used for validation or serialization of `Viz` instances,
       * but solely to help in the creation of new visualization instances,
       * such as is done by the provided factory method,
       * [createAsync]{@link pentaho.visual.base.Viz.createAsync},
       * which uses these to _default_ the type of model and view of a provided specification.
       *
       * A visualization instance contains two properties,
       * [model]{@link pentaho.visual.base.Viz#model} and
       * [view]{@link pentaho.visual.base.Viz#view},
       * which are always automatically kept in sync so that
       * the view's model is the model of the visualization.
       *
       * The [valueType]{@link pentaho.type.Property.Type#valueType} of
       * these is not expected to be overridden and
       * should always be `Model` and `View`, respectively.
       * Again, this design allows loading `Viz` types without loading their associated,
       * default `Model` and `View` types.
       *
       * Serialization of a visualization instance follows this pattern and
       * serializes `model` besides `view`, instead of `model` within `view`.
       *
       * @constructor
       * @description Creates a visualization instance.
       * @param {pentaho.visual.base.spec.IViz} [vizSpec] A plain object containing the visualization specification.
       */

      var Viz = Complex.extend(/** @lends pentaho.visual.base.Viz# */{

        constructor: function(vizSpec) {

          // Ensure that vizSpec.model wins over vizSpec.view.model.
          var viewSpec;
          if(vizSpec != null && (viewSpec = vizSpec.view) != null) {
            viewSpec.model = vizSpec.model; // Whatever it is.
          }

          this.base(vizSpec);
        },

        // region Synchronize View.Model and Model
        /** @inheritDoc */
        _onChangeWill: function(changeset) {

          // emit event

          var cancelReason = this.base(changeset);
          if(cancelReason == null) {
            // Now sync `model` and `view.model`.
            this.__syncModelAndViewModel(changeset);
          }

          return cancelReason;
        },

        /**
         * Synchronizes `view.model` with the value of `model`
         * whenever `model`, `view` or `view.model` are replaced (in any possible combination of these).
         *
         * @param {!pentaho.type.changes.Changeset} changeset - The set of changes.
         *
         * @private
         */
        __syncModelAndViewModel: function(changeset) {

          var change = changeset.getChange("model");

          // Ignore inner changes.
          if(change !== null && change.type === "replace") {
            this.__setViewModelToModel();
          } else {
            change = changeset.getChange("view");
            if(change !== null) {
              // eslint-disable-next-line default-case
              switch(change.type) {
                case "replace":
                  this.__setViewModelToModel();
                  break;

                case "complex":
                  change = change.getChange("model");
                  if(change !== null && change.type === "replace") {
                    this.__setViewModelToModel();
                  }
                  break;
              }
            }
          }
        },

        /**
         * Actually sets the ambient value of `view.model` to the ambient value of `model`, if `view` is defined.
         *
         * @private
         */
        __setViewModelToModel: function() {
          var view = this.view;
          if(view !== null) {
            view.model = this.model;
          }
        },
        // endregion

        // region serialization
        /** @inheritDoc */
        toSpecInContext: function(keyArgs) {

          // Ideally we'd be able to specify `keyArgs.omitProps["view.model"] = true`,
          // but nested paths are not supported, so we're serializing `model` twice :-(
          var spec = this.base(keyArgs);
          var viewSpec;
          if(spec !== null && (viewSpec = spec.view) !== null) {
            delete viewSpec.model;
          }
        },
        // endregion

        $type: /** @lends pentaho.visual.base.Viz.Type# */{

          id: module.id,

          // region modelTypeId
          __modelTypeId: Model.type.id,

          /**
           * Gets or sets the identifier of the default model type.
           *
           * The default model type is metadata
           * that can be used for creating *new* visualization instances.
           *
           * Setting to a {@link Nully} or an empty value causes inheriting the base type's value.
           *
           * When set to a relative type identifier,
           * it is relative to this type's [sourceId]{@link pentaho.type.Type#sourceId},
           * and is immediately made absolute.
           * If this type is anonymous, an error is thrown.
           *
           * @type {nonEmptyString}
           * @default "pentaho/visual/base/model"
           *
           * @throws {OperationInvalidError} When `modelTypeId` is a relative identifier and this type is anonymous,
           * or when `modelTypeId` refers to an inexistent ascendant location.
           *
           * @see pentaho.visual.base.Viz.createAsync
           * @see pentaho.visual.base.Viz#viewTypeId
           */
          get modelTypeId() {
            return this.__modelTypeId;
          },

          set modelTypeId(value) {

            value = text.nonEmptyString(value);

            if(value === null) {
              // Inherit, unless we're the root proto.
              if(this !== Viz.type) {
                delete this.__modelTypeId;
              }
            } else {
              this.__modelTypeId = this.buildSourceRelativeId(value);
            }
          },
          // endregion

          // region viewTypeId
          __viewTypeId: View.type.id,

          /**
           * Gets or sets the identifier of the default view type.
           *
           * The default view type is metadata
           * that can be used for creating *new* visualization instances.
           *
           * Setting to a {@link Nully} or an empty value causes inheriting the base type's value.
           *
           * When set to a relative type identifier,
           * it is relative to this type's [sourceId]{@link pentaho.type.Type#sourceId},
           * and is immediately made absolute.
           * If this type is anonymous, an error is thrown.
           *
           * @type {nonEmptyString}
           * @default "pentaho/visual/base/view"
           *
           * @throws {OperationInvalidError} When `viewTypeId` is a relative identifier and this type is anonymous,
           * or when `viewTypeId` refers to an inexistent ascendant location.
           *
           * @see pentaho.visual.base.Viz.createAsync
           * @see pentaho.visual.base.Viz#modelTypeId
           */
          get viewTypeId() {
            return this.__viewTypeId;
          },

          set viewTypeId(value) {

            value = text.nonEmptyString(value);

            if(value === null) {
              // Inherit, unless we're the root proto.
              if(this !== Viz.type) {
                delete this.__viewTypeId;
              }
            } else {
              this.__viewTypeId = this.buildSourceRelativeId(value);
            }
          },
          // endregion

          props: [
            /**
             * Gets or sets the model of the visualization.
             *
             * When set and
             * this visualization's [view]{@link pentaho.visual.base.Viz#view} is defined,
             * its [model]{@link pentaho.visual.base.View#model} is also set to this value.
             *
             * @name model
             * @memberOf pentaho.visual.base.Viz#
             */
            {
              name: "model",
              valueType: Model,
              isRequired: true,
              // Break multiple model inner-change propagation paths.
              // `view.model` _replace_ change will bubble through the `view` property only.
              // Other `view.model` nested changes are ignored.
              isBoundary: true
            },

            /**
             * Gets or sets the view of the visualization.
             *
             * When set and
             * this visualization's [model]{@link pentaho.visual.base.Viz#model} is defined,
             * its [model]{@link pentaho.visual.base.View#model} is also set to this value.
             *
             * @name model
             * @memberOf pentaho.visual.base.Viz#
             */
            {
              name: "view",
              valueType: View,
              isRequired: true
            }
          ]
        }
      }, /** @lends pentaho.visual.base.Viz */{
        /**
         * Creates a visualization instance, asynchronously, given its specification.
         *
         * If the `model` property is {@link Nully} or
         * a plain JavaScript object without an inline type property, `_`,
         * a `Model` object of type {@link pentaho.visual.base.Viz.Type#modelTypeId} will be created.
         *
         * If the `view` property is {@link Nully} or
         * a plain JavaScript object without an inline type property, `_`,
         * a `View` object of type {@link pentaho.visual.base.Viz.Type#viewTypeId} will be created.
         *
         * In all other aspects, this method behaves like the {@link pentaho.type.Type#createAsync} counterpart method.
         *
         * @param {pentaho.visual.base.spec.IViz} vizSpec - A visualization specification.
         *
         * @return {!Promise.<pentaho.visual.base.Viz>} A promise for a visualization with the given specification.
         *
         * @rejects {pentaho.lang.ArgumentRequiredError} When `vizSpec` is not specified.
         */
        createAsync: function(vizSpec) {

          if(!vizSpec) return Promise.reject(error.argRequired("vizSpec"));

          vizSpec = __defaultCreateVizSpec.call(this, vizSpec);

          return this.type.createAsync(vizSpec);
        },

        /**
         * Creates a visualization instance, synchronously, given its specification.
         *
         * If the `model` property is {@link Nully} or
         * a plain JavaScript object without an inline type property, `_`,
         * a `Model` object of type {@link pentaho.visual.base.Viz.Type#modelTypeId} will be created.
         *
         * If the `view` property is {@link Nully} or
         * a plain JavaScript object without an inline type property, `_`,
         * a `View` object of type {@link pentaho.visual.base.Viz.Type#viewTypeId} will be created.
         *
         * In all other aspects, this method behaves like the {@link pentaho.type.Type#create} counterpart method.
         *
         * @param {pentaho.visual.base.spec.IViz} vizSpec - A visualization specification.
         *
         * @return {!Promise.<pentaho.visual.base.Viz>} A promise for a visualization with the given specification.
         *
         * @throws {pentaho.lang.ArgumentRequiredError} When `vizSpec` is not specified.
         */
        create: function(vizSpec) {

          if(!vizSpec) throw error.argRequired("vizSpec");

          vizSpec = __defaultCreateVizSpec.call(this, vizSpec);

          return this.type.create(vizSpec);
        }
      })
      .implement({$type: bundle.structured});

      return Viz;
    }
  ];

  /**
   * Defaults the given visualization specification.
   *
   * @param {!pentaho.visual.base.spec.IViz} vizSpec - A visualization specification.
   * @return {!pentaho.visual.base.spec.IViz} The defaulted visualization specification.
   * @memberOf pentaho.visual.base.Viz
   * @private
   */
  function __defaultCreateVizSpec(vizSpec) {

    vizSpec = Object.create(vizSpec);

    var spec = vizSpec.model;
    if(spec != null && spec.constructor === Object && !spec._) {
      spec = Object.create(spec);
      spec._ = this.type.modelTypeId;
    }

    spec = vizSpec.view;
    if(spec != null && spec.constructor === Object && !spec._) {
      spec = Object.create(spec);
      spec._ = this.type.viewTypeId;
    }

    return vizSpec;
  }
});
