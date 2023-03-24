/*!
 * Copyright 2023 Hitachi Vantara. All rights reserved.
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

/* globals pho */

/*
 * Portions of this file are based on jQuery UI, v1.13.2
 */

var pho = pho || {};
if (pho.util == null) {
  pho.util = {};
}

(function() {
  "use strict";

  // Guard against later replacement of the global jQuery by another instance
  // which would not have the below registered pseudo-selectors.
  var jQueryLocal = $;

  // region Extends jQuery with tabbable and focusable.
  // Adapted from https://github.com/jquery/jquery-ui/blob/1.13.2/ui/focusable.js and ./tabbable.js
  function isFocusable(elem, hasTabindex) {
    var nodeName = elem.nodeName.toLowerCase();
    if(nodeName === "area") {
      var map = elem.parentNode;
      var mapName = map.name;
      if(!elem.href || !mapName || map.nodeName.toLowerCase() !== "map") {
        return false;
      }

      var $img = jQueryLocal("img[usemap='#" + mapName + "']");
      return $img.length > 0 && $img.is(":visible");
    }

    var focusableIfVisible;
    if(/^(input|select|textarea|button|object)$/.test(nodeName)) {
      focusableIfVisible = !elem.disabled;
      if(focusableIfVisible) {

        // Form controls within a disabled fieldset are disabled.
        // However, controls within the fieldset's legend do not get disabled.
        // Since controls generally aren't placed inside legends, we skip
        // this portion of the check.
        var $fieldset = jQueryLocal(elem).closest("fieldset")[0];
        if($fieldset) {
          focusableIfVisible = !$fieldset.disabled;
        }
      }
    } else if(nodeName === "a") {
      focusableIfVisible = elem.href || hasTabindex;
    } else {
      focusableIfVisible = hasTabindex;
    }

    var $elem = jQueryLocal(elem);
    return focusableIfVisible && $elem.is(":visible") && $elem.css("visibility") === "visible";
  }

  jQueryLocal.extend(jQueryLocal.expr.pseudos, {
    "pen-focusable": function(element) {
      return isFocusable(element, jQueryLocal.attr(element, "tabindex") != null);
    },
    "pen-tabbable": function(element) {
      var tabIndex = jQueryLocal.attr(element, "tabindex");
      var hasTabindex = tabIndex != null;
      return (!hasTabindex || tabIndex >= 0) && isFocusable(element, hasTabindex);
    }
  });
  // endregion

  var Selectors = {
    tabbable: ":pen-tabbable",
    focusable: ":pen-focusable"
  };

  var suspendFocusRingCount = 0;

  function createDisposable(dispose) {
    dispose.remove = dispose;

    return dispose;
  }

  function optionalArg(o, p, dv) {
    var v;
    return o && (v = o[p]) != null ? v : dv;
  }

  function expandSelection(contextElem, selector) {
    var expanded = [];

    var selection = selector(contextElem);
    var L = selection.length;
    for(var i = 0; i < L; i++) {
      var contentDocument = safeGetContentDocument(selection[i]);
      if(contentDocument != null) {
        expanded.push.apply(expanded, expandSelection(contentDocument, selector));
      } else {
        expanded.push(selection[i]);
      }
    }

    return expanded;
  }

  function safeGetContentDocument(elem) {
    if (elem.tagName.toLowerCase() === "iframe" ) {
      try {
        return elem.contentDocument;
      } catch(e) {
        // cross-domain error
      }
    }

    return null;
  }

  function getSelectorFromFocusableArg(keyArgs) {
    return optionalArg(keyArgs, "focusable", false) ? Selectors.focusable : Selectors.tabbable;
  }

  /**
   * Contains utilities for dealing with focus.
   * @namespace
   * @private
   */
  pho.util._focus = {
    /**
     * Gets a jQuery instance which is ensured to have the custom pseudo-selectors,
     * `:pen-tabbable` and `:pen-focusable`, registered.
     * @type {jQuery}
     */
    jQuery: jQueryLocal,

    Selectors: Selectors,

    isTabbable: function(elem, keyArgs) {
      return elem != null && jQueryLocal(elem).filter(getSelectorFromFocusableArg(keyArgs)).length > 0;
    },

    /**
     * Gets the descendant elements of `root` which can receive focus, in document order.
     *
     * For `iframe` elements from a same domain,
     * the focusable elements of their content document are included instead.
     *
     * @param {?Element} [root] - The root element. Defaults to the body of this frame's document.
     * @param {?Object} [keyArgs] The keyword arguments object.
     * @param {boolean} [keyArgs.focusable=false] - Indicates that all focusable elements should be considered,
     *   including those just which can only be focused using the mouse or code.
     * @param {boolean} [keyArgs.self=false] - Indicates that the root element should also be considered,
     *   at first position.
     */
    tabbables: function(root, keyArgs) {
      if(root == null) {
        root = document.body;
      }

      var selectorFun = jQueryLocal.bind(null, getSelectorFromFocusableArg(keyArgs));

      var selection = expandSelection(root, selectorFun);

      if(optionalArg(keyArgs, "self", false) && selectorFun(root).length > 0) {
        selection.unshift(root);
      }

      return selection;
    },

    /**
     * Gets the first descendant element of `root` which can receive focus, in document order.
     *
     * For `iframe` elements from a same domain,
     * the focusable elements of their content document are included instead.
     *
     * @param {?Element} [root] - The root element. Defaults to the body of this frame's document.
     * @param {?Object} [keyArgs] The keyword arguments object.
     * @param {boolean} [keyArgs.focusable=false] - Indicates that all focusable elements should be considered,
     *   including those just which can only be focused using the mouse or code.
     * @param {boolean} [keyArgs.self=false] - Indicates that the root element should also be considered,
     *   at first position.
     * @return The first focusable element, if any; <code>null</code>, otherwise.
     */
    firstTabbable: function(root, keyArgs) {
      return this.tabbables(root, keyArgs)[0] || null;
    },

    /**
     * Gets the last descendant element of `root` which can receive focus, in document order.
     *
     * For `iframe` elements from a same domain,
     * the focusable elements of their content document are included instead.
     *
     * @param {?Element} [root] - The root element. Defaults to the body of this frame's document.
     * @param {?Object} [keyArgs] The keyword arguments object.
     * @param {boolean} [keyArgs.focusable=false] - Indicates that all focusable elements should be considered,
     *   including those just which can only be focused using the mouse or code.
     * @param {boolean} [keyArgs.self=false] - Indicates that the root element should also be considered,
     *   at first position.
     * @return The last focusable element, if any; <code>null</code>, otherwise.
     */
    lastTabbable: function(root, keyArgs) {
      var tabbables = this.tabbables(root, keyArgs);
      var L = tabbables.length;
      return L > 0 ? tabbables[L - 1] : null;
    },

    /**
     * Gets the first element after the given one which can currently receive focus.
     *
     * @param {Element} elem The initial element.
     * @param {?Object} [keyArgs] The keyword arguments object.
     * @param {?Element} [keyArgs.root] - The root element. Defaults to the body of this frame's document.
     * @param {?Element} [keyArgs.focusable] - Indicates that all focusable elements should be considered,
     *   including those just which can only be focused using the mouse or code.
     * @return The next focusable element, if any; <code>null</code>, otherwise.
     */
    nextTabbable: function(elem, keyArgs) {
      var tabbables = this.tabbables(optionalArg(keyArgs, "root"), keyArgs);
      var L = tabbables.length;
      if(L === 0) {
        return null;
      }

      // Not found or found at last position.
      var index = tabbables.indexOf(elem);
      if(index < 0 || index === (L - 1)) {
        return tabbables[0];
      }

      return tabbables[index + 1];
    },

    /**
     * Gets the first element before the given one which can currently receive focus.
     * @param {Element} elem The initial element.
     * @param {?Object} [keyArgs] The keyword arguments object.
     * @param {?Element} [keyArgs.root] - The root element. Defaults to the body of this frame's document.
     * @param {?Element} [keyArgs.focusable] - Indicates that all focusable elements should be considered,
     *   including those just which can only be focused using the mouse or code.
     * @return The previous focusable element, if any; <code>null</code>, otherwise.
     */
    previousTabbable: function(elem, keyArgs) {
      var tabbables = this.tabbables(optionalArg(keyArgs, "root"), keyArgs);
      var L = tabbables.length;
      if(L === 0) {
        return null;
      }

      // Not found or found at first position.
      var index = tabbables.indexOf(elem);
      if(index <= 0) {
        return tabbables[L - 1];
      }

      return tabbables[index - 1];
    },

    closestTabbable: function(elem, keyArgs) {
      return jQueryLocal(elem).closest(getSelectorFromFocusableArg(keyArgs))[0] || null;
    },

    containsFocus: function(rootElem) {
      var activeElem = document.activeElement;
      return activeElem != null && rootElem.contains(activeElem);
    },

    uiKey: function(elem) {
      return (elem && elem.dataset.penUiKey) || null;
    },

    queryByUIKey: function(root, uiKey) {
      if(root == null) {
        root = document.documentElement;
      }

      if(this.uiKey(root) === uiKey) {
        return root;
      }

      return root.querySelector('[data-pen-ui-key="' + CSS.escape(uiKey) + '"]');
    },

    refreshElement: function(elem, keyArgs) {
      if(elem == null) {
        return null;
      }

      var root = optionalArg(keyArgs, "root") || elem.ownerDocument.documentElement;

      // assert root != null

      // Still contained within root?
      if (root.contains(elem)) {
        return elem;
      }

      // May belong to document but not be within root anymore.
      // Try to find one/another within root.

      var uiKey = this.uiKey(elem);
      if(uiKey != null) {
        return this.queryByUIKey(root, uiKey);
      }

      var id = elem.id;
      if(id) {
        // Assume it has a stable id...
        return root.querySelector("#" + CSS.escape(id));
      }

      return null;
    },

    captureState: function(elem, keyArgs) {
      var root = optionalArg(keyArgs, "root", null);
      var focusable = optionalArg(keyArgs, "focusable", false);
      var tabbables = this._previousAndSelfTabbables(elem, keyArgs);
      
      var me = this;
      return {
        closest: function() {
          var keyArgs2 = {root: root, focusable: focusable};
          
          for(var i = tabbables.length - 1; i >= 0; i--) {
            var refreshed = me.refreshElement(tabbables[i], keyArgs2);
            if(refreshed != null && me.isTabbable(refreshed, keyArgs2)) {
              return refreshed;
            }
          }

          return null;
        }
      };
    },

    _previousAndSelfTabbables: function(elem, keyArgs) {
      var tabbables = this.tabbables(optionalArg(keyArgs, "root"), keyArgs);
      var L = tabbables.length;
      if(L === 0) {
        return [];
      }

      var index = tabbables.indexOf(elem);
      if(index < 0) {
        return [];
      }

      // Remove elements following elem.
      tabbables.splice(index + 1);

      return tabbables;
    },

    suspendFocusRing: function(keyArgs) {
      var isAuto = optionalArg(keyArgs, "isAuto", true);
      var duration = optionalArg(keyArgs, "duration", 10);

      var timeoutHandle = null;
      var suspended = true;

      // Suspend it!
      suspendFocusRingCount++;
      if(suspendFocusRingCount === 1) {
        document.body.classList.add("focus-ring-disabled");
      }

      // Install timeout to resume.
      if(isAuto) {
        timeoutHandle = setTimeout(resumeFocusRing, duration);
      }

      return createDisposable(resumeFocusRing);

      function resumeFocusRing() {
        if(!suspended) {
          return;
        }

        suspended = false;

        if(timeoutHandle != null) {
          clearTimeout(timeoutHandle);
          timeoutHandle = null;
        }

        suspendFocusRingCount--;
        if(suspendFocusRingCount === 0) {
          document.body.classList.remove("focus-ring-disabled");
        }
      }
    }
  };
})();

define("common-ui/util/_focus", function() {
  return pho.util._focus;
});
