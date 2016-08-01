/*!
 * Copyright 2010 - 2016 Pentaho Corporation. All rights reserved.
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
  "pentaho/lang/Base",
  "pentaho/lang/EventSource",
  "./events/WillUpdate",
  "./events/DidUpdate",
  "./events/RejectedUpdate",
  "pentaho/lang/UserError",
  "pentaho/data/filter",
  "pentaho/util/object",
  "pentaho/util/arg",
  "pentaho/util/fun",
  "pentaho/util/BitSet",
  "pentaho/util/error",
  "pentaho/util/logger",
  "pentaho/util/promise"
], function(Base, EventSource, WillUpdate, DidUpdate, RejectedUpdate, UserError,
            filter, O, arg, F, BitSet, error, logger, promise) {

  "use strict";

  /**
   * @name pentaho.visual.base.View
   * @memberOf pentaho.visual.base
   * @class
   * @extends pentaho.lang.Base
   * @abstract
   * @amd pentaho/visual/base/View
   *
   * @classDesc This is the base class for visualizations.
   *
   * A container is expected to instantiate a `View` with a reference to a `Model` instance,
   * which may not be immediately valid.
   *
   * Over time, the container mutates the `Model` instance and triggers events.
   * In response, the method [_onChange]{@link pentaho.visual.base.View#_onChange} is
   * invoked to process the events, which may cause the `View` to update itself.
   *
   * @description Initializes a `View` instance.
   *
   * @constructor
   * @param {pentaho.visual.base.Model} model - The base visualization `Model`.
   */
  /*global Promise:false */

  // Allow ~0
  // jshint -W016

  var _reUpdateMethodName = /^_update(.+)$/;

  var View = Base.extend(/** @lends pentaho.visual.base.View# */{

    constructor: function(domContainer, model) {
      if(!domContainer) throw error.argRequired("domContainer");
      if(!model) throw error.argRequired("model");

      this.__domContainer = domContainer;

      /**
       * The DOM node where the visualization should render.
       * @type {?(Node|Text|HTMLElement)}
       * @protected
       * @readonly
       */
      this.__model = model;

      /**
       * The model of the visualization.
       * @type {pentaho.visual.base.Model}
       * @readonly
       */
      this.__updatingPromise = null;

      /**
       * Indicates when an update is in progress.
       * @type {boolean}
       * @readonly
      this.__isAutoUpdate = true;

       */
      this.__dirtyPropGroups = new BitSet(View.PropertyGroups.All); // mark view as initially dirty

      this.__changeDidHandle = model.on("did:change", this.__onChangeDidOuter.bind(this));
    },

    //region Properties
    /**
     * Gets the view's DOM node.
     *
     * @type {?(Node|Text|HTMLElement)}
     */
    get domContainer() {
      return this.__domContainer;
    },

    get model() {
      return this.__model;
    },

    /**
     * Gets the context of the view's model.
     *
     * This getter is syntax sugar for `this.model.type.context`.
     *
     * @type {pentaho.type.Context}
     */
    get context() {
      return this.model.type.context;
    },

    /**
     * Gets the value that indicates if an update is in progress.
     *
     * @type {!boolean}
     */
    get isUpdating() {
      return !!this.__updatingPromise;
    },

    /**
     * Orchestrates the rendering of the visualization and is meant to be invoked by the container.
    get isAutoUpdate() {
      return this.__isAutoUpdate;
    },

    set isAutoUpdate(value) {
      this.__isAutoUpdate = !!value;
    },

    get isDirty() {
      // Because dirty prop groups are cleared optimistically before update methods run,
      // it is needed to use isUpdating to not let that transient non-dirty state show through.
      return this.isUpdating || !this.__dirtyPropGroups.isEmpty;
    },
    //endregion

    //region Changes
    __onChangeDidOuter: function(event) {

      var bitSetNew = new BitSet();

      this._onChangeDid(bitSetNew, event.changeset);

      if(!bitSetNew.isEmpty) {

        this.__dirtyPropGroups.set(bitSetNew.get());

        if(this.isAutoUpdate) {
          this.update()["catch"](function(error) {
            logger.warn("Auto-update was canceled: " + error);
          });
        }
      }
    },

    _onChangeDid: function(dirtyPropGroups, changeset) {

      changeset.propertyNames.forEach(function(name) {

        var dirtyGroupName = this[name] || "General";

        dirtyPropGroups.set(View.PropertyGroups[dirtyGroupName]);

      }, this.constructor.__PropertyGroupOfProperty);
    },
    //endregion

    //region Update
     *
     * Executes [_update]{@link pentaho.visual.base.View#_update} asynchronously in
     * the will/did/rejected event loop associated with an update of a visualization,
     * and also creates the visualization DOM node the first time it successfully updates.
     *
     * In order to get the visualization DOM node,
     * listen to the {@link pentaho.visual.base.events.DidCreate|"did:create"} event.
     *
     * @return {Promise} A promise that is fulfilled when the visualization
     * is completely rendered. If the visualization is in an invalid state, the promise
     * is immediately rejected.
     *
     * @fires "will:update"
     * @fires "did:update"
     * @fires "rejected:update"
     * @fires "did:create"
     */
    update: function() {

      var p = this.__updatingPromise;
      if(!p) {
        // Nothing to do?
        if(this.__dirtyPropGroups.isEmpty) {
          p = Promise.resolve();
        } else {
          var _resolve = null, _reject = null;

          this.__updatingPromise = p = new Promise(function(resolve, reject) {
            // ignore the fulfillment value of returned promises
            _resolve = function() { resolve(); };
            _reject  = reject;
          });

          // Protect against overrides failing.
          var cancelReason;
          try {
            cancelReason = this._onUpdateWill();
          } catch(ex) { cancelReason = ex; }

          (cancelReason ? Promise.reject(cancelReason) : this.__updateLoop())
            .then(this.__onUpdateDidOuter.bind(this), this.__onUpdateRejectedOuter.bind(this))
            .then(_resolve, _reject);
        }
      }

      return p;
    },

    _onUpdateWill: function() {

      if(this._hasListeners(WillUpdate.type)) {

        var willUpdate = new WillUpdate(this);

        if(!this._emitSafe(willUpdate))
          return willUpdate.cancelReason;
      }

      return null;
    },

    __updateLoop: function() {

      // assert !this.__dirtyPropGroups.isEmpty;

      var validationErrors = this.__validate();
      if(validationErrors)
        return Promise.reject(new UserError("View model is invalid:\n - " + validationErrors.join("\n - ")));

      // ---

      var dirtyPropGroups = this.__dirtyPropGroups;
      var updateMethodInfo = this.__selectUpdateMethod(dirtyPropGroups);

      // Assume update succeeds.
      dirtyPropGroups.clear(updateMethodInfo.mask);

      var me = this;

      return promise.wrapCall(this[updateMethodInfo.name], this)
          .then(function() {

            return dirtyPropGroups.isEmpty ? Promise.resolve() : me.__updateLoop();

          }, function(reason) {

            // Restore
            dirtyPropGroups.set(updateMethodInfo.mask);

            return Promise.reject(reason);
          });
    },

    /**
     * Updates a visualization.
     *
     * If the visualization is valid, the visualization element will be created on the first update
     * and proceed with the visualization update; otherwise, it will be rejected and prevent the update.
     *
     * @return {Promise} A promise that is fulfilled when the visualization
     * is completely rendered. If the visualization is in an invalid state, the promise
     * is immediately rejected.
     * 
     * @protected
     */
    __validate: function() {
      return this.model.validate();
    },

    __selectUpdateMethod: function(dirtyPropGroups) {

      var ViewClass = this.constructor;

      // 1. Is there an exact match?
      var methodInfo = ViewClass.__UpdateMethods[dirtyPropGroups.get()];
      if(!methodInfo) {

        // TODO: A sequence of methods that handles the dirty bits...

        // 2. Find the first method that cleans all (or more) of the dirty bits.
        ViewClass.__UpdateMethodsList.some(function(info) {
          if(dirtyPropGroups.isSubsetOf(info.mask)) {
            methodInfo = info;
            return true;
          }
        });

        // At least the _updateAll method is registered. It is able to handle any dirty bits.
        // assert methodInfo
      }

      return methodInfo;
    },

    /**
     * Called before the visualization is discarded.
     */
    __onUpdateDidOuter: function() {

      // J.I.C.
      this.__dirtyPropGroups.clear();
      this.__updatingPromise =  null;

      // ---

      this.__callOverridableSafe("_onUpdateDid");
    },

    /**
     * Sets the DOM node that the visualization will use to render itself.
     * 
     * @param {?(Node|Text|HTMLElement)} domNode - Visualization's DOM node.
     * @protected
     */
    __onUpdateRejectedOuter: function(reason) {

      this.__updatingPromise = null;

      // ---

      this.__callOverridableSafe("_onUpdateRejected", reason);

      return Promise.reject(reason);
    },

    /**
     * Initializes the visualization.
     *
     * This method is invoked by the constructor of `pentaho.visual.base.View`.
     * Override this method to perform initialization tasks,
     * such as setting up event listeners.
     *
     * @protected
     */
    _onUpdateDid: function() {

      if(this._hasListeners(DidUpdate.type))
        this._emitSafe(new DidUpdate(this));
    },

    /**
     * Validates the current state of the visualization.
     *
     * By default, this method simply calls {@link pentaho.visual.base.Model#validate}
     * to validate the model.
     *
     * @return {?Array.<!pentaho.type.ValidationError>} A non-empty array of errors or `null`.
     * @protected
     */
    _onUpdateRejected: function(reason) {

      if(this._hasListeners(RejectedUpdate.type))
        this._emitSafe(new RejectedUpdate(this, reason));
    },

    //endregion

    /**
     * Determines if the visualization is in a valid state.
     *
     * A visualization in an invalid state should not be rendered.
     *
     * @return {boolean} Returns `true` if this visualization is valid, or `false` if not valid.
     * @protected
     * @see pentaho.visual.base.View#_validate
     */
    dispose: function() {

      this.__domContainer = null;

      var h = this.__changeDidHandle;
      if(h) {
        h.dispose();
        this.__changeDidHandle = null;
      }
    },

    // see Base.js
    extend: function(source, keyArgs) {

      this.base(source, keyArgs);

      if(source) {
        var Subclass = this.constructor;

        O.eachOwn(source, function(v, methodName) {
          var m;
          if(F.is(v) && (m = _reUpdateMethodName.exec(methodName))) {

            var methodCleansBits = parsePropertyGroupsText(Subclass, m[1]);
            if(methodCleansBits && !Subclass.__UpdateMethods[methodCleansBits]) {
              var updateMethodInfo = {
                name: methodName,
                mask: methodCleansBits
              };

              Subclass.__UpdateMethods[methodCleansBits] = updateMethodInfo;
              Subclass.__UpdateMethodsList.push(updateMethodInfo);

              Subclass.__UpdateMethodsList.sort(function(a, b) {
                // Never happens: if(a.mask === b.mask) return 0;
                return new BitSet(a.mask).isSubsetOf(b.mask) ? -1 : 1;
              });
            }
          }
        });
      }

      return this;
    },

    __callOverridableSafe: function(methodName) {
      var args = arg.slice(arguments, 1);
      try {
        return this[methodName].apply(this, args);
      } catch(ex) {
        logger.error("Exception thrown by 'View#" + methodName + "' override:" + ex + "\n" + ex.stack);
      }
    }
  }, /** @lends pentaho.visual.base.View */{
    // see Base.js
    _subclassed: function(Subclass, instSpec, classSpec, keyArgs) {

      // "Inherit" PropertyGroups, __PropertyGroupOfProperty, __UpdateMethods and __UpdateMethodsList properties
      Subclass.PropertyGroups            = Object.create(this.PropertyGroups);
      Subclass.__PropertyGroupOfProperty = Object.create(this.__PropertyGroupOfProperty);
      Subclass.__UpdateMethods           = Object.create(this.__UpdateMethods);
      Subclass.__UpdateMethodsList       = this.__UpdateMethodsList.slice();

      this.base(Subclass, instSpec, classSpec, keyArgs);
    },

    PropertyGroups: O.assignOwn(Object.create(null),
    /**
     * Renders the visualization.
     *
     * Subclasses of `pentaho.visual.base.View` must override this method
     * and implement a complete rendering of the visualization.
     {
      All: ~0,

      Ignored: 0,

      General: 1,

      Data: 2,

      Size: 4,

      Selection:  8
    }),

    __PropertyGroupOfProperty: O.assignOwn(Object.create(null), {
      "selectionMode":   "Ignored",
      "data":            "Data",
      "width":           "Size",
      "height":          "Size",
      "selectionFilter": "Selection"
    }),

    // bits -> {name: , mask: }
    __UpdateMethods: Object.create(null),

    // [{name: , mask: }, ...]
    __UpdateMethodsList: []
  })
  .implement(EventSource)
  .implement(/** @lends pentaho.visual.base.View# */{
    //region _updateXyz Methods
     *
     * @protected
     * @abstract
     */
    _updateAll: function() {
    },

    /**
     * Updates the visualization, taking into account that
     * only the dimensions have changed.
     *
     * Subclasses of `pentaho.visual.base.View` are expected to override this method to
     * implement a fast and cheap resizing of the visualization.
     * By default, this method invokes [_update]{@link pentaho.visual.base.View#_update}.
     *
     * @protected
     */

    /**
     * Updates the visualization, taking into account that
     * only the selection has changed.
     *
     * Subclasses of `pentaho.visual.base.View` are expected to override this method
     * with an implementation that
     * updates the selection state of the items displayed by this visualization.
     * By default, this method invokes [_update]{@link pentaho.visual.base.View#_update}.
     *
     * @protected
     */

    /**
     * Decides how the visualization should react
     * to a modification of its properties.
     *
     * By default, this method selects the cheapest reaction to a change of properties.
     * It invokes:
     * - [_resize]{@link pentaho.visual.base.View#_resize} when either of the properties
     * [width]{@link pentaho.visual.base.Model.Type#width} or
     * [height]{@link pentaho.visual.base.Model.Type#height} change,
     * - [_selectionChanged]{@link pentaho.visual.base.View#_selectionChanged} when the property
     * [selectionFilter]{@link pentaho.visual.base.Model.Type#selectionFilter} changes
     * - [_update]{@link pentaho.visual.base.View#_update} when any other property changes.
     *
     * Subclasses of `pentaho.visual.base.View` can override this method to
     * extend the set of fast render methods.
     *
     * @see pentaho.visual.base.View#_resize
     * @see pentaho.visual.base.View#_selectionChanged
     * @see pentaho.visual.base.View#_update
     *
     * @param {!pentaho.type.Changeset} changeset - Map of the properties that have changed.
     *
     * @protected
     */
    //endregion
  });

  function parsePropertyGroupsText(ViewClass, groupNamesText) {

    var groupsBits = 0;

    groupNamesText.split("And").forEach(function(groupName) {
      var groupBits = ViewClass.PropertyGroups[groupName];
      if(groupBits == null || isNaN(+groupBits)) {
        logger.warn("There is no registered property group with name '" + groupName + "'.");
      } else {
        groupsBits |= groupBits;
      }
    });

    return groupsBits;
  }

  return View;
});
