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

  /**
   * The `setTimeout` handle for a scheduled focus operation.
   * @type {?number}
   */
  var timeoutSetFocus = null;

  /**
   * The element for which the set focus operation is scheduled.
   * @type {?Element}
   */
  var scheduledSetFocusElem = null;

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

    /**
     * Sets focus on a given element.
     *
     * This method sets the focus <i>after</i> the current event loop turn,
     * so that setting the focus works regardless of whether it is called within an event handler,
     * including one whose default action sets the focus to another element.
     *
     * Additionally, when setting the focus via this method, the method {@link #getActiveElement} will
     * return the latest scheduled element to set focus on, if any, before consulting `document.activeElement`.
     *
     * @param elem The element to focus on.
     */
    setFocus: function(elem) {
      // Cancel scheduled set focus, if any.
      if (timeoutSetFocus != null) {
        clearTimeout(timeoutSetFocus);
        timeoutSetFocus = scheduledSetFocusElem = null;
      }

      scheduledSetFocusElem = elem;

      if(scheduledSetFocusElem != null) {
        timeoutSetFocus = setTimeout(function() {
          scheduledSetFocusElem.focus();
          timeoutSetFocus = scheduledSetFocusElem = null;
        });
      }
    },

    /**
     * Gets the active element of the current document or any of its descendant documents of the same domain.
     *
     * If setting focus to an element has been scheduled via {@link #focus},
     * then that element is returned instead.
     *
     * @return {?Element} The active element, if any; `null`, otherwise.
     */
    getActiveElement: function() {
      // Prefer our own pending set focus to the actual active element.
      if(scheduledSetFocusElem != null) {
        return scheduledSetFocusElem;
      }

      var activeElement = document.activeElement;
      while(activeElement !== null && activeElement.tagName.toLowerCase() === "iframe") {
        try {
          activeElement = activeElement.contentDocument.activeElement;
        } catch(ex) {
          // Cross-site security.
          // Just keep the iframe as the active element.
          break;
        }
      }

      return activeElement;
    },

    /**
     * Gets the descendant elements of `root` which can receive keyboard focus, in document order.
     *
     * For `iframe` elements from a same domain,
     * the keyboard focusable elements of their content document are included instead.
     *
     * @param {?Element} [root] - The root element. Defaults to the body of this frame's document.
     * @return {Element[]} An array of keyboard focusable elements.
     */
    tabbables: function(root) {
      return expandSelection(root || document.body, function(elem) {
        return jQueryLocal(Selectors.tabbable, elem);
      });
    },

    /**
     * Gets the element after the given one which can currently receive keyboard focus.
     * @param elem The initial element.
     * @return The next keyboard-focusable element, if any; <code>null</code>, otherwise.
     */
    nextTabbable: function(elem) {
      var tabbables = this.tabbables();
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
     * Gets the element before the given one which can currently receive keyboard focus.
     * @param elem The initial element.
     * @return The previous keyboard-focusable element, if any; <code>null</code>, otherwise.
     */
    previousTabbable: function(elem) {
      var tabbables = this.tabbables();
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
    }
  };
})();

define("common-ui/util/_focus", function() {
  return pho.util._focus;
});
