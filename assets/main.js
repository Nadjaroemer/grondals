var WDN = WDN || {};

// Assigning variables on init
(function () {
  var root = document.documentElement;
  var init, setVariable;

  var nodes = {
    header: document.querySelector("[data-header]"),
  };

  setVariable = function (name, value) {
    root.style.setProperty(name, value);
  };

  init = function () {
    setVariable("--header-height", nodes.header.offsetHeight + "px");
  };

  init();
})();

if (typeof WDN.Debounce === "undefined") {
  WDN.Debounce = (function () {
    var Debounce = function (Function, WaitTime) {
      // Named function to start / clear timer
      var Timer;
      return function () {
        var This = this,
          args = arguments;
        var later = function () {
          Timer = null;
          Function.apply(This, args);
        };
        clearTimeout(Timer);
        Timer = setTimeout(later, WaitTime);
      };
    };
    return Debounce;
  })();
}

if (typeof WDN.Request === "undefined") {
  WDN.Request = (function () {
    // Private function
    var _do;

    // Public function
    var Get, Post;

    var config = {
      defaultContentType: "application/json;charset=UTF-8",
      version: "1.1.2",
    };

    _do = function (obj) {
      var req = new XMLHttpRequest();

      if (obj.method == "POST" || obj.method == "PUT") {
        var contentType = obj.contentType || config.defaultContentType;
        req.open(obj.method, obj.url);
        req.setRequestHeader("Content-Type", contentType);
      }

      req.onreadystatechange = function () {
        if (req.readyState == 4) {
          if (req.status > 399 && req.status < 600) {
            if (obj.onError) {
              obj.onError(req.responseText);
            }
          }
          if (req.status == 200) {
            if (obj.onSuccess) {
              obj.onSuccess(req.responseText);
            }
          }
        }
      };

      if (obj.method == "POST" || obj.method == "PUT") {
        if (obj.contentType && obj.contentType !== config.defaultContentType) {
          req.send(obj.data);
        } else {
          req.send(JSON.stringify(obj.data));
        }
      } else {
        req.open("GET", obj.url, true);
        req.send(null);
      }
    };

    Get = function (obj) {
      _do({
        method: "GET",
        url: obj.url,
        onSuccess: function (res) {
          obj.type == "JSON" ? obj.onSuccess(JSON.parse(res)) : obj.onSuccess(res);
        },
        onError: function (res) {
          if (obj.onError) {
            if (obj.type == "JSON") {
              obj.onError(JSON.parse(res));
            } else {
              obj.onError(res);
            }
          }
        },
      });
    };

    Post = function (obj) {
      _do({
        method: "POST",
        url: obj.url,
        data: obj.data,
        contentType: obj.contentType,
        onSuccess: function (res) {
          obj.onSuccess(JSON.parse(res));
        },
        onError: function (res) {
          if (obj.onError) {
            obj.onError(res);
          }
        },
      });
    };

    return {
      Get: Get,
      Post: Post,
      Version: config.version,
    };
  })();
}

if (typeof WDN.Cart === "undefined") {
  WDN.Cart = (function () {
    // Include WDN.Request
    var Request = WDN.Request;

    if (!Request) {
      console.warn("Could not include WDN.Cart. WDN.Request was not found");
      return false;
    }

    // Public
    var Add, Update, Change, Get, Remove, Clear;

    // Private helpers
    var isFunction, onCartUpdate, _fireCustomEvent;

    isFunction = function (func) {
      return typeof func === "function";
    };

    GlobalRoutes = WDN.Routes;

    var Routes = {
      add: GlobalRoutes.cart_add_url + ".js",
      get: GlobalRoutes.cart_url + ".js",
      update: GlobalRoutes.cart_update_url + ".js",
      clear: GlobalRoutes.cart_clear_url + ".js",
      change: GlobalRoutes.cart_change_url + ".js",
    };

    Get = function (obj) {
      Request.Get({
        url: Routes.get,
        onSuccess: function (res) {
          onCartUpdate(res, "fetched");
          if (isFunction(obj.onSuccess)) {
            obj.onSuccess(res);
          }
        },
        onError: function (res) {
          onCartUpdate(res, "fetched");
          if (isFunction(obj.onError)) {
            obj.onError(res);
          }
        },
        type: "JSON",
      });
    };

    Add = function (obj) {
      Request.Post({
        url: Routes.add,
        data: obj.data,
        onSuccess: function (res) {
          onCartUpdate(res, "added");
          if (isFunction(obj.onSuccess)) {
            obj.onSuccess(res);
          }
        },
        onError: function (res) {
          onCartUpdate(res, "added");
          if (isFunction(obj.onError)) {
            obj.onError(res);
          }
        },
      });
    };

    Update = function (obj) {
      Request.Post({
        url: Routes.update,
        data: obj.data,
        onSuccess: function (res) {
          onCartUpdate(res, "updated");
          if (isFunction(obj.onSuccess)) {
            obj.onSuccess(res);
          }
        },
        onError: function (res) {
          onCartUpdate(res, "updated");
          if (isFunction(obj.onError)) {
            obj.onError(res);
          }
        },
      });
    };

    Clear = function (obj) {
      Request.Post({
        url: Routes.clear,
        onSuccess: function (res) {
          onCartUpdate(res, "cleared");
          if (obj) {
            if (isFunction(obj.onSuccess)) {
              obj.onSuccess(res);
            }
          }
        },
        onError: function (res) {
          onCartUpdate(res, "cleared");
          if (obj) {
            if (isFunction(obj.onError)) {
              obj.onError(res);
            }
          }
        },
      });
    };

    Remove = function (obj) {
      var data = {
        updates: { [obj.id]: 0 },
      };
      Update({ data: data, onSuccess: obj.onSuccess });
    };

    Change = function (obj) {
      Request.Post({
        url: Routes.change,
        data: obj.data,
        onSuccess: function (res) {
          onCartUpdate(res, "changed");
          if (isFunction(obj.onSuccess)) {
            obj.onSuccess(res);
          }
        },
        onError: function (res) {
          onCartUpdate(res, "changed");
          if (isFunction(obj.onError)) {
            obj.onError(res);
          }
        },
      });
    };

    onCartUpdate = function (res, action) {
      _fireCustomEvent(res, action);
    };

    _fireCustomEvent = function (res, action) {
      var eventName = "cart:" + action;
      var cartEvent = new CustomEvent(eventName, {
        detail: {
          res: res || false,
        },
      });
      document.body.dispatchEvent(cartEvent);
    };

    return {
      Add: Add,
      Update: Update,
      Get: Get,
      Remove: Remove,
      Clear: Clear,
      Change: Change,
    };
  })();
}

if (typeof WDN.Component === "undefined") {
  class WDNComponent extends HTMLElement {
    constructor() {
      super();
      this.Request = WDN.Request;
      this.Cart = WDN.Cart;
      this.Routes = WDN.Routes;
      this.Debounce = WDN.Debounce;
    }

    cartCount(action, newValue) {
      if (action !== "set" && action !== "update") {
        return;
      }
      this.fireEvent({
        name: "cartcount:" + action,
        detail: newValue || false,
      });
    }

    loading(newState, target) {
      var target = target || document.body;

      if (newState) {
        target.setAttribute("data-loading", "");
      } else {
        target.removeAttribute("data-loading");
      }

      this.isLoading = newState;
    }

    renderSections(target, res) {
      if (target) {
        var output = [];
        for (var key in res) {
          if (res.hasOwnProperty(key)) {
            output.push(res[key]);
          }
        }
        target.innerHTML = output.join("");
      }
    }

    fetchSections(ids, callback, _catch) {
      if (typeof this.Request === "object") {
        this.Request.Get({
          url: this.Routes.root_url + "?sections=" + ids,
          type: "JSON",
          onSuccess: typeof callback === "function" ? callback : false,
          onError: typeof _catch === "function" ? _catch : false,
        });
      }
    }

    /**
     *
     * @param {object} data
     */
    fireEvent(data) {
      var target = data.target || document.body;
      target.dispatchEvent(new CustomEvent(data.name, { detail: data.detail }));
    }

    /**
     *
     * @param {NodeList} targets
     * @param {string} event
     * @param {func} callback
     */
    bindElements(targets, event, callback) {
      targets.forEach(function (target) {
        this.bindElement(target, event, callback);
      }, this);
    }

    /**
     *
     * @param {Node} target
     * @param {string} event
     * @param {func} callback
     */
    bindElement(target, event, callback) {
      if (target && event && callback) {
        target.addEventListener(event, callback);
      }
    }

    /**
     *
     * @param {Node} target
     * @param {string} event
     * @param {func} callback
     */
    unbindElement(target, event, callback) {
      if (target && event && callback) {
        target.removeEventListener(event, callback);
      }
    }
  }

  WDN.Component = WDNComponent;
}

/* QUANTITY MODULE  */
/* QUANTITY MODULE  */
class WDNQuantity extends WDN.Component {
  constructor() {
    super();
    /* Nodes */
    this.input = this.querySelector("[data-quantity-input]");
    this.increaseBtn = this.querySelector("[data-quantity-control='increase']");
    this.decreaseBtn = this.querySelector("[data-quantity-control='decrease']");
    /* Attributes  */
    this.id = this.getAttribute("id");
    this.min = this.input.getAttribute("min") || -999;
    this.min = parseInt(this.min); // parseInt on a new line because 0 == false and "0" == true
    this.max = parseInt(this.input.getAttribute("max")) || 999;
    this.value = parseInt(this.input.value);

    /* Init  */
    this.init();
  }

  // sets value of the input
  set(newValue) {
    this.value = newValue;
    this.input.value = newValue;
    this.fireEvent({
      name: "quantity:change",
      detail: this,
    });

    if (typeof this.onQuantityChange === "function") {
      if (!this.changeBound) {
        this.changeBound = WDN.Debounce(this.onQuantityChange, 100);
      }

      this.changeBound();
    }
  }

  // returns input value
  get() {
    return this.value;
  }

  // increases input value by 1
  increase() {
    var newValue = this.value + 1;
    if (newValue <= this.max) {
      this.set(newValue);
    }
    this.validateQuantity();
  }
  // decreases input value by 1
  decrease() {
    var newValue = this.value - 1;
    if (newValue >= this.min) {
      this.set(newValue);
    }
    this.validateQuantity();
  }

  inputIsValid() {
    var inputValue = this.input.value;
    return inputValue >= this.min && inputValue <= this.max;
  }

  // validates and updates input value
  inputOnChange() {
    // Validating if input value is in between min and max
    if (this.inputIsValid()) {
      this.set(this.input.value);
    }
  }

  bind() {
    this.bindElement(this.increaseBtn, "click", this.increase.bind(this));
    this.bindElement(this.decreaseBtn, "click", this.decrease.bind(this));
    this.bindElement(this.input, "change", this.inputOnChange.bind(this));
  }

  // disables increase button
  disableIncButton() {
    if (this.increaseBtn) {
      this.increaseBtn.disabled = true;
    }
  }
  // disables decrease button
  disableDecButton() {
    if (this.decreaseBtn) {
      this.decreaseBtn.disabled = true;
    }
  }

  // enables increase button
  enableIncButton() {
    if (this.increaseBtn) {
      this.increaseBtn.disabled = false;
    }
  }

  // enables decrease button
  enableDecButton() {
    if (this.decreaseBtn) {
      this.decreaseBtn.disabled = false;
    }
  }

  validateQuantity() {
    this.enableDecButton();
    this.enableIncButton();
    // checking if next values will go past min/max
    var incValue = this.value + 1;
    var decValue = this.value - 1;
    // disabling inccrease button
    if (incValue > this.max) {
      this.disableIncButton();
    }
    // disabling decrease button
    if (decValue < this.min) {
      this.disableDecButton();
    }
  }

  setInitialState() {
    //  enabling all controls
    this.validateQuantity();
  }

  init() {
    // disabling buttons if next value will hit min/max
    this.setInitialState();
    this.bind();
  }
}

customElements.define("wdn-quantity", WDNQuantity);

/* CART QUANTITY */
/* CART QUANTITY */
class WDNCartQuantity extends WDNQuantity {
  constructor() {
    super();
    this.cart_drawer_form = document.querySelector("wdn-cart-form");
    this.cart_container = document.querySelector("[data-cart-layout]");
  }

  /**
   *
   * @param {object} res
   */
  onRequestSuccess(res) {
    this.cart_drawer_form.setLoad();
    this.cartCount("set", res.item_count);
    this.cart_drawer_form.load();

    this.fireEvent({
      name: "cart:updated",
      detail: res,
    });
  }

  /**
   *
   * @param {object} res
   */
  onRequestError(res) {
    this.fireEvent({
      name: "cart:error",
      detail: res,
    });
  }

  // callback on WDNQuantity change
  onQuantityChange() {
    var id = this.id; // varaint id
    var value = this.value; // input value
    this.Cart.Update({
      data: { updates: { [id]: value } },
      onSuccess: this.onRequestSuccess.bind(this),
      onError: this.onRequestError.bind(this),
    });
  }
}

customElements.define("wdn-cart-quantity", WDNCartQuantity);
/* CART REMOVE */
class WDNCartRemove extends WDN.Component {
  constructor() {
    super();

    this.cart_drawer = document.querySelector("wdn-cart-form");
    this.cart_container = document.querySelector("[data-cart-layout]");
    this.variantId = this.getAttribute("id");

    this.bindElement(this, "click", this.onClick.bind(this));
  }

  onRemove(res) {
    this.cartCount("set", res.item_count);
    this.cart_drawer.load();
  }

  onClick() {
    this.Cart.Remove({
      id: this.variantId,
      onSuccess: this.onRemove.bind(this),
    });
  }
}

customElements.define("wdn-cart-remove", WDNCartRemove);

class WDNCartForm extends WDN.Component {
  constructor() {
    super();

    this.form = this.querySelector("form");
    this.cart_container = this;
  }

  mountTerms() {
    var checkboxTerms = new Terms("cart-summary", {
      sendToCart: false,
    });

    if (checkboxTerms) {
      var validateIfCheckboxTermsAccepted = function (form) {
        if (!checkboxTerms.accepted) {
          form.preventDefault();

          checkboxTerms.setErrorState();
        }
      };
    }
  }

  setLoad() {
    this.loading(true, this);
  }

  removeLoading() {
    this.loading(false, this);
  }

  onCartLoad(r) {
    var html = document.createElement("div");
    html.innerHTML = r["cart-layout"];

    var cart_inner = html.querySelector("wdn-cart-form").innerHTML;
    this.form.innerHTML = cart_inner;

    this.mountTerms();
    this.removeLoading();

    this.fireEvent({
      name: "cart:updated",
      detail: cart,
    });
  }

  afterCartLoad(cart) {
    this.cart = cart;
    this.setLoad();
    this.cartCount("set", cart.item_count);

    var form = this.form;

    this.fetchSections("cart-layout", this.onCartLoad.bind(this));
  }

  load() {
    this.Cart.Get({
      onSuccess: this.afterCartLoad.bind(this),
      onError: function () {
        console.warn("Cart failed to load...");
      },
    });
  }
}

customElements.define("wdn-cart-form", WDNCartForm);

/* CART COUNT  */
/* CART COUNT  */
if (!customElements.get("wdn-cart-count")) {
  class WDNCartCount extends WDN.Component {
    constructor() {
      super();
      this.output = this.querySelector("[data-value]");
      this.value = parseInt(this.output.getAttribute("data-value"));
      this.init();
    }

    show() {
      this.removeAttribute("data-hide");
    }

    hide() {
      this.setAttribute("data-hide", "");
    }

    toggle() {
      if (this.value > 0) {
        this.show();
      } else {
        this.hide();
      }
    }

    setValue(newValue) {
      this.value = parseInt(newValue);
      this.output.innerHTML = newValue;
      this.toggle();
    }

    onSet(e) {
      var newValue = e.detail;
      this.setValue(newValue);
    }

    onCartFetch(res) {
      this.setValue(res.item_count);
    }

    onCartError() {}

    updateCartCount() {
      this.Cart.Get({
        onSuccess: this.onCartFetch.bind(this),
        onError: this.onCartError.bind(this),
      });
    }

    bind() {
      this.bindElement(document.body, "cartcount:set", this.onSet.bind(this));
      this.bindElement(document.body, "cartcount:update", this.updateCartCount.bind(this));
    }

    init() {
      this.bind();
    }
  }

  customElements.define("wdn-cart-count", WDNCartCount);
}

/* DRAWER/MODAL */
class WDNOverlay extends WDN.Component {
  constructor() {
    super();

    // Config
    this.config = {
      classes: {
        body_open: "overlay--open",
        open_vertical: "overlay--open-vertical",
        open_horizonal: "overlay--open-horizontal",
      },
      version: "1.1",
    };

    // Storing attributes
    this.id = this.getAttribute("data-id");
    this.isActive = this.getAttribute("data-active") == "";
    this.animate = this.getAttribute("data-animate");
    // Getting and storing type of the overlay (drawer,modal etc)
    var type = this.getAttribute("type") || "overlay";
    this.type = type;

    // setup of custom events names
    this.events = {
      open: type + ":opened",
      close: type + ":closed",
    };

    // Event Callbacks
    this.closeOnKeyBound = this.closeOnKey.bind(this);
    this.closeOnClickBound = this.closeOnClick.bind(this);

    // INIT
    this.init();
  }

  active(newState) {
    if (newState) {
      this.setAttribute("data-active", "");
    } else {
      this.removeAttribute("data-active");
    }
    this.isActive = newState;
  }

  setActive() {
    this.active(true);
    this.appendActiveClasses();
  }

  setInactive() {
    this.active(false);
    this.removeActiveClasses();
  }

  open() {
    // Close all drawers
    // Close all drawers
    // Close all drawers
    /* this.fireEvent({
     name: 'overlay:close',
     target: document.body,
   }); */
    // Close all drawers
    // Close all drawers
    // Close all drawers

    // setting element as active
    this.setActive();
    // Bind window events
    this.bindWindowEvents();
    // fire custom event
    this.fireEvent({
      name: this.events.open,
      detail: this,
    });
  }

  close() {
    // clearing active state
    this.setInactive();
    // Unbind window events
    this.unbindWindowEvents();
    // fire custom events
    this.fireEvent({
      name: this.events.close,
      detail: this,
    });
  }

  // listens for ESC key
  closeOnKey(e) {
    if (e.keyCode == 27) {
      this.close();
    }
  }

  // listens for outside click
  closeOnClick(e) {
    // first rule is for drawer, second one is for modal
    if (e.target === document.body || (e.target === this && this.nodeName === "WDN-MODAL")) {
      this.close();
    }
  }

  // fires when element is opened
  bindWindowEvents() {
    this.bindElement(window, "keydown", this.closeOnKeyBound);
    this.bindElement(window, "click", this.closeOnClickBound);
  }

  // fires when element is closed
  unbindWindowEvents() {
    this.unbindElement(window, "keydown", this.closeOnKeyBound);
    this.unbindElement(window, "click", this.closeOnClickBound);
  }

  // fires when element is opened
  appendActiveClasses() {
    this.classList.add(this.currentAnimation);
    document.body.classList.add(this.config.classes.body_open);
  }

  // fires when element is closed
  removeActiveClasses() {
    this.classList.remove(this.currentAnimation);

    var openDrawersCount = document.querySelectorAll("wdn-drawer[data-active]").length + 1;

    // Dont faded bg before all drawers are closed
    if (openDrawersCount > 1) {
      return;
    }

    var openClass = this.config.classes.body_open;

    if (!this.ignoreFade) {
      document.body.classList.add("overlay--open-fade-out");
      setTimeout(function () {
        document.body.classList.remove(openClass);
        document.body.classList.remove("overlay--open-fade-out");
      }, 200);
    }
  }

  setupAnimation() {
    // By default, overlay opens horizontally
    this.currentAnimation = this.config.classes.open_horizonal;
    if (this.animate === "top" || this.animate === "bottom") {
      this.currentAnimation = this.config.classes.open_vertical;
    }
  }

  onCloseEvent(e) {
    if (this.isActive) {
      this.ignoreFade = true;
      this.close();
      this.ignoreFade = false;
    }
  }

  listenForEvents() {
    this.bindElement(document.body, "overlay:close", this.onCloseEvent.bind(this));
  }

  init() {
    this.listenForEvents();
    this.setupAnimation();
  }
}

/* UNIVERSAL DRAWER/MODAL TRIGGER  */
class WDNOverlayTrigger extends WDN.Component {
  constructor() {
    super();
    // drawer/modal id
    this.id = this.getAttribute("data-id");
    // actions - open, close
    this.action = this.getAttribute("action");
    // type can be modal, drawer etc
    this.type = this.getAttribute("type");
    // drawer/modal
    this.element = document.querySelector("wdn-" + this.type + "[data-id='" + this.id + "']");

    // INIT
    this.bind();
  }

  handleClick() {
    if (this.action === "close") {
      this.element.close();
    }
    if (this.action === "open") {
      this.element.open();
    }
  }

  bind() {
    if (this.element) {
      this.addEventListener("click", this.handleClick.bind(this));
    }
  }
}

/* DRAWER CLOSER */
class WDNDrawerClose extends WDNOverlayTrigger {
  constructor() {
    super();
    this.element = document.querySelector("wdn-drawer[data-id='" + this.id + "']");
    this.action = "close";
    this.bind();
  }
}

/* MODAL CLOSER */
class WDNModalClose extends WDNOverlayTrigger {
  constructor() {
    super();
    this.element = document.querySelector("wdn-modal[data-id='" + this.id + "']");
    this.action = "close";
    this.bind();
  }
}

/* DRAWER OPENER */
class WDNDrawerOpen extends WDNOverlayTrigger {
  constructor() {
    super();
    this.element = document.querySelector("wdn-drawer[data-id='" + this.id + "']");
    this.action = "open";
    this.bind();
  }
}

/* MODAL OPENER  */
class WDNModalOpen extends WDNOverlayTrigger {
  constructor() {
    super();
    this.element = document.querySelector("wdn-modal[data-id='" + this.id + "']");
    this.action = "open";
    this.bind();
  }
}

class WDNModal extends WDNOverlay {
  constructor() {
    super();
    this.config.classes.body_open = "modal--open";
  }
}

if (!customElements.get("wdn-cart-count")) {
  class WDNCartCount extends WDN.Component {
    constructor() {
      super();
      this.value = parseInt(this.getAttribute("data-value"));
      this.init();
    }

    show() {
      this.removeAttribute("data-hide");
    }

    hide() {
      this.setAttribute("data-hide", "");
    }

    toggle() {
      if (this.value > 0) {
        this.show();
      } else {
        this.hide();
      }
    }

    setValue(newValue) {
      this.value = parseInt(newValue);
      this.innerHTML = newValue;
      this.toggle();
    }

    onSet(e) {
      var newValue = e.detail;
      this.setValue(newValue);
    }

    onCartAdd(e) {}

    onCartFetch(res) {
      this.setValue(res.item_count);
    }

    onCartError() {}

    updateCartCount() {
      this.Cart.Get({
        onSuccess: this.onCartFetch.bind(this),
        onError: this.onCartError.bind(this),
      });
    }

    bind() {
      document.body.addEventListener("cartcount:set", this.onSet.bind(this));
      document.body.addEventListener("cartcount:update", this.updateCartCount.bind(this));
    }

    init() {
      this.toggle();
      this.bind();
    }
  }

  customElements.define("wdn-cart-count", WDNCartCount);
}

// Drawer/ Modal
customElements.define("wdn-overlay-trigger", WDNOverlayTrigger);
customElements.define("wdn-drawer", class extends WDNOverlay {});
customElements.define("wdn-modal", WDNModal);
// openers / closers
customElements.define("wdn-drawer-close", WDNDrawerClose);
customElements.define("wdn-modal-close", WDNModalClose);
customElements.define("wdn-drawer-open", WDNDrawerOpen);
customElements.define("wdn-modal-open", WDNModalOpen);

/* PRODUCT FORM  */
/* PRODUCT FORM  */

class WDNProductForm extends WDN.Component {
  constructor() {
    super();

    this.variantSelect = this.querySelector("variant-select");
    this.form = this.querySelector("form");
    this.openDrawer = this.form.hasAttribute("data-open-drawer");
    this.cartDrawer = document.querySelector("wdn-drawer[data-id='cart_drawer']");
    this.onAdd = function (cart_response) {};
    this.bindElement(this.form, "submit", this.onFormSubmit.bind(this));

    var handlers = {};
    handlers.quickshop__mobile = this.quickshop_mobile_success;
    handlers.cart_drawer_open = this.cart_drawer_open;
    handlers.related_variant_drawer = this.related_variant_drawer;

    this.callback_handlers = handlers;
  }

  serialize(form) {
    return Array.from(new FormData(form), function (e) {
      return e.map(encodeURIComponent).join("=");
    }).join("&");
  }

  quickshop_mobile_success() {
    document.body.setAttribute("data-product-added-recently", "");

    setTimeout(function () {
      document.body.removeAttribute("data-product-added-recently");
    }, 4000);
  }

  related_variant_drawer() {
    document.body.setAttribute("data-product-added-recently", "");
    document.body.setAttribute("data-product-added-recently-variants", "");

    setTimeout(function () {
      document.body.removeAttribute("data-product-added-recently");
    }, 4000);

    setTimeout(function () {
      document.body.removeAttribute("data-product-added-recently-variants", "");
    }, 4600);
  }

  cart_drawer_open() {
    var handleCartDrawerOpen = function (r) {
      var cart_drawer = document.querySelector('wdn-drawer[data-id="cart_drawer"]');
      var search_drawer = document.querySelector('wdn-drawer[data-id="search"]');

      cart_drawer.open();

      document.body.removeEventListener("cart:updated", handleCartDrawerOpen);
    };

    document.body.addEventListener("cart:updated", handleCartDrawerOpen);
  }

  loadCart() {
    var cart_drawer_form = document.querySelector("wdn-cart-form");
    cart_drawer_form.load();
  }

  onSubmitSuccess(res) {
    this.loading(false);
    this.loadCart();

    var defaultCallbackAction = "cart_drawer_open";

    if (this.hasAttribute("data-form-callback")) {
      if (this.callback_handlers[this.getAttribute("data-form-callback")]) {
        defaultCallbackAction = this.getAttribute("data-form-callback");
      }
    }

    var cb = this.callback_handlers[defaultCallbackAction];

    cb();

    if (this.openDrawer) {
      this.fireEvent({
        name: "cart:added",
        detail: res,
      });
    }

    this.cartCount("update");
    typeof this.onFormSuccess === "function" ? this.onFormSuccess(res) : "";
  }

  onSubmitError(res) {
    this.loading(false);
    this.fireEvent({
      name: "cart:error",
      detail: res,
    });
    typeof this.onFormError === "function" ? this.onFormError(res) : "";
  }

  getFormInfo() {
    return this.serialize(this.form);
  }

  _submit() {
    var form_data = this.serialize(this.form);
    this.Request.Post({
      url: WDN.Routes.cart_add_url + ".js",
      data: form_data,
      contentType: "multipart/form-data",
      onSuccess: this.onSubmitSuccess.bind(this),
      onError: this.onSubmitError.bind(this),
    });
  }

  onFormSubmit(evt) {
    evt.preventDefault();
    if (this.variantSelect) {
      if (!this.variantSelect.activeOption) return;
    }

    this.loading(true);
    this._submit();
  }
}

customElements.define("wdn-product-form", WDNProductForm);

if (!customElements.get("wdn-product-form-adder")) {
  class WDNProductFormAdder extends HTMLElement {
    constructor() {
      super();
      this.productId = this.getAttribute("data-form-id");
      this.form = document.querySelector("wdn-product-form[data-product-id='" + this.productId + "']");
      this.init();
    }

    onClick(e) {
      e ? e.preventDefault() : "";
      this.form ? this.form._submit() : "";
    }

    init() {
      this.bindElement(this, "click", this.onClick.bind(this));
    }
  }

  customElements.define("wdn-product-form-adder", WDNProductFormAdder);
}

/* SEARCH */
/* SEARCH */
if (typeof WDN.Search === "undefined") {
  WDN.Search = (function () {
    var Init, Bind, InputOnKeyDown, Search, RenderInitialLayout;
    var _bindInput, _bindPagination, _bindSearchSuggestions;
    var paginationOnClick, suggestionOnClick, InputOnClear;
    var form = document.querySelector("[data-search-form]");
    var input = form.querySelector("[data-search-input]");
    var target = document.querySelector("[data-search-results");
    var clearSearch = document.querySelectorAll("[data-search-clear]");
    var _bindForm, formOnSubmit, onTemplateFetch, onFetchError;
    // depends on
    var Debounce = WDN.Debounce;

    Search = function (query) {
      var url = "/search?q=" + query + "&type=product&view=request";
      WDN.Request.Get({
        url: url,
        onSuccess: onTemplateFetch,
      });
    };

    InputOnKeyDown = function (e) {
      var input = e.target;
      var query = input.value.trim();
      switch (true) {
        case query == "" && input.value.length > 0:
          return;
        case query.length == 0 && input.value.length == 0:
          RenderInitialLayout();
          break;
        case query.length > 0:
          Search(query);
          break;
      }
    };

    InputOnClear = function (e) {
      if (input.value.length == 0) {
        RenderInitialLayout();
      }
    };

    RenderInitialLayout = function () {
      WDN.Request.Get({
        url: "/search?&view=request",
        onSuccess: onTemplateFetch,
      });
    };

    _bindInput = function () {
      if (input) {
        input.addEventListener("keydown", Debounce(InputOnKeyDown, 325));
        input.addEventListener("search", InputOnClear); // listening for input clear
      }
    };
    formOnSubmit = function (e) {
      e ? e.preventDefault() : "";
    };

    _bindForm = function () {
      if (form) {
        form.addEventListener("submit", formOnSubmit);
      }
    };

    _bindSearchSuggestions = function () {
      var suggestions = document.querySelectorAll("[data-search-suggestion]");
      suggestions.forEach(function (suggestion) {
        suggestion.addEventListener("click", suggestionOnClick);
      });
    };

    suggestionOnClick = function (e) {
      e ? e.preventDefault() : "";
      var query = this.dataset.searchSuggestion;
      input.value = query;
      Search(query);
    };

    _bindPagination = function () {
      var paginationPrev = document.querySelector("[data-pagination-previous]");
      var paginationNext = document.querySelector("[data-pagination-next]");

      if (paginationPrev) {
        paginationPrev.addEventListener("click", paginationOnClick);
      }
      if (paginationNext) {
        paginationNext.addEventListener("click", paginationOnClick);
      }
    };

    onTemplateFetch = function (res) {
      target.innerHTML = res;
      _bindSearchSuggestions();
      _bindPagination();

      clearSearch = document.querySelectorAll("[data-search-clear]");

      clearSearch.forEach(function (elem) {
        elem.addEventListener("click", function () {
          input.value = "";
          input.dispatchEvent(new Event("search"));
          input.focus();
        });
      });
    };

    onFetchError = function (res) {};

    paginationOnClick = function (e) {
      e.preventDefault();
      var url = this.href;

      WDN.Request.Get({
        url: url,
        onSuccess: onTemplateFetch,
        onError: onFetchError,
      });
    };

    document.body.addEventListener("overlay:opened", function (e) {
      if (e.detail && e.detail.id === "search") {
        input.focus();
      }
    });

    Bind = function () {
      _bindForm();
      _bindInput();
      _bindPagination();
      _bindSearchSuggestions();
    };
    Init = function () {
      Bind();
    };

    Init();

    return {
      Init: Init,
    };
  })();
}

class WDNDropdown extends HTMLElement {
  constructor() {
    super();
    this.buildConstructor();
    this.init();
  }

  configureAttributes() {
    this.nameSpace = this.getAttribute("data-name") || "dropdown";
    this.id = this.getAttribute("data-id");

    this.selectors = {
      trigger: "[" + this.nameSpace + "-trigger]",
      container: "[" + this.nameSpace + "-container]",
      content: "[" + this.nameSpace + "-content]",
    };

    this.attributeList = {
      group: "group",
      active: this.nameSpace + "-active",
    };
  }

  buildConstructor() {
    this.configureAttributes();
    this.trigger = this.querySelector(this.selectors.trigger);
    this.container = this.querySelector(this.selectors.container);
    this.content = this.querySelector(this.selectors.content);
    this.group = this.getAttribute(this.attributeList.group);
    this.isActive = this.getAttribute(this.attributeList.active) === "";
    if (!this.trigger) return;
    this.removeTriggerOnExpand = this.trigger.getAttribute("data-remove-on-expand") === "";
  }

  setState(newState) {
    this.isActive = newState;
  }

  setContainerHeight(newHeight) {
    this.container.style.height = newHeight + "px";
  }

  shrinkContainer() {
    this.setContainerHeight(0);
  }

  expandContainer() {
    var contentHeight = this.content.offsetHeight;
    this.setContainerHeight(contentHeight);
  }

  setInactive() {
    this.setState(false);
    this.removeAttribute(this.attributeList.active);
    this.shrinkContainer();

    // this will help when extending the component
    if (typeof this.onClose === "function") {
      this.onClose();
    }
  }

  setActive() {
    this.collapseGroupContainers();
    this.setState(true);
    this.setAttribute(this.attributeList.active, "");
    this.expandContainer();

    // this will help when extending the component
    if (typeof this.onOpen === "function") {
      this.onOpen();
    }
  }

  fireGroupEvent() {
    var customEvent = new CustomEvent("dropdown:group:collapse", {
      detail: { group: this.group },
    });
    document.body.dispatchEvent(customEvent);
  }

  collapseGroupContainers() {
    if (this.group) {
      this.fireGroupEvent();
    }
  }

  onTriggerClick() {
    if (this.isActive) {
      this.setInactive();
    } else {
      this.setActive();
    }

    this.fireChangeEvent();
    if (typeof this.onClick === "function") {
      this.onClick();
    }
    if (this.removeTriggerOnExpand) {
      this.trigger.classList.add("hide");
    }
  }

  fireChangeEvent() {
    setTimeout(
      function () {
        document.dispatchEvent(new CustomEvent("dropdown:toggled", { detail: this }));
      }.bind(this),
      400
    );
  }

  onWindowResize() {
    if (this.isActive) {
      this.expandContainer();
    }
  }

  onGroupCollapse(e) {
    if (this.group === e.detail.group) {
      this.setInactive();
    }
  }

  setInitialState() {
    if (this.isActive) {
      this.expandContainer();
    }
  }

  bind() {
    if (!this.trigger) return;
    this.trigger.addEventListener("click", this.onTriggerClick.bind(this));
    document.body.addEventListener("dropdown:group:collapse", this.onGroupCollapse.bind(this));
    window.addEventListener("resize", this.onWindowResize.bind(this));
  }

  init() {
    this.setInitialState();
    this.bind();
  }
}
if (!customElements.get("wdn-dropdown")) {
  customElements.define("wdn-dropdown", WDNDropdown);
}

if (typeof WDN.ProductRecommendations === "undefined") {
  WDN.ProductRecommendations = (function () {
    var base_route = WDN.Routes.product_recommendations_url;

    var default_settings = {
      section_name: "product-recommendations",
      amount_to_get: 6,
    };

    var notify_root = function (name, contents) {
      var e = new CustomEvent("recommendations:update", {
        detail: {
          id: "cart-recommendations",
          content: contents,
        },
      });

      document.body.dispatchEvent(e);
    };

    var Recommendations = function (config) {
      this.id = false; // applied later when called
      this.section_id = config.id;
      this.amount = config.amount || default_settings.amount;
      this.section_name = config.section_name || default_settings.section_name;
      this.recommendations = false;
    };

    Recommendations.prototype.onProductsUpdate = function () {};

    Recommendations.prototype.onLoad = function (res) {
      this.updateRecommendations(res);
      notify_root(this.section_id, res);
      this.onProductsUpdate();
    };

    Recommendations.prototype.updateRecommendations = function (res) {
      this.recommendations = res;
    };

    Recommendations.prototype.load = function (id) {
      if (id) {
        this.id = id;
      }

      if (!this.id) {
        console.warn("Can not provide recommendations without product ID");
        return;
      }

      // Build endpoint for loading recommendations
      // with correct product ID, template and amount

      var endpointForSection = [base_route + "?section_id=" + this.section_name + "&product_id=" + this.id + "&limit=" + this.amount].join("");

      // Use endpoint to load, and save in this.recommendations
      var params = {
        url: endpointForSection,
      };

      params.onSuccess = this.onLoad.bind(this);

      WDN.Request.Get(params);
    };
    return Recommendations;
  })();
}

/* ANNOUNCEMENT  */
if (typeof WDN.Announcement === "undefined") {
  WDN.Announcement = (function () {
    var Names = {
      announcement: "Announcement",
      close: "Icon--close",
      hasClose: "data-has-close",
      hide: "data-hidden",
      fixed: "data-fixed",
      sticky: "Announcement--fixed",
    };

    var Selectors = {
      announcement: `.${Names.announcement}`,
      close: `.${Names.close}`,
      hasClose: `.${Names.announcement}[${Names.hasClose}]`,
      isFixed: `.${Names.announcement}[${Names.fixed}]`,
    };

    var Nodes = {
      announcement: document.querySelector(`${Selectors.announcement}`),
      announcementHasClose: document.querySelector(Selectors.hasClose),
      announcementIsFixed: document.querySelector(Selectors.isFixed),
      close: document.querySelector(`${Selectors.announcement} ${Selectors.close}`),
    };

    var Config = {
      Cookie: {
        name: "Announcement",
        expires: 1,
      },
      ElementPosition: false,
    };

    // priv
    var Init, Show, ToggleFixed, SetFixed, ClearFixed, Bind, Close, CookieExists, Found;

    Close = function () {
      Nodes.announcement.setAttribute(Names.hide, "");
      Cookies.set(Config.Cookie.name, true, {
        expires: Config.Cookie.expires,
        path: window.location.pathname,
      });
    };

    Show = function () {
      Nodes.announcement.removeAttribute(Names.hide);
    };

    Bind = function () {
      Nodes.close.addEventListener("click", Close);
      if (Nodes.announcementIsFixed) {
        Config.ElementPosition = Nodes.announcement.offsetTop + Nodes.announcement.offsetHeight;
        window.addEventListener("scroll", ToggleFixed);
      }
    };

    ToggleFixed = WDN.Debounce(ToggleFixed, 10);

    SetFixed = function () {
      Nodes.announcement.classList.add(Names.sticky);
      Nodes.announcement.parentNode.style.paddingTop = Nodes.announcement.offsetHeight + "px";
    };

    ClearFixed = function () {
      Nodes.announcement.classList.remove(Names.sticky);
      Nodes.announcement.parentNode.style.paddingTop = 0;
    };

    ToggleFixed = function () {
      var ScrollPosition = this.pageYOffset || document.documentElement.scrollTop;
      if (ScrollPosition > Config.ElementPosition) {
        SetFixed();
      } else {
        ClearFixed();
      }
    };

    // Do we have a valid bar
    Found = function () {
      return Nodes.announcement && Nodes.announcementHasClose;
    };

    CookieExists = function () {
      return !!Cookies.get(Config.Cookie.name);
    };

    Init = function () {
      if (Found()) {
        if (!CookieExists()) {
          Show();
          Bind();
        }
      }
    };

    Init();

    return {};
  })();
}

/* Progress bar */
/* Progress bar */
class WDNProgressBar extends WDN.Component {
  constructor() {
    super();
    this.id = this.getAttribute("data-id");
    this.bar = this.querySelector("[data-bar]");
    this.init();
  }

  set(percentage) {
    percentage = percentage > 100 ? 100 : percentage;
    percentage = percentage < 0 ? 0 : percentage;
    this.bar.style.width = percentage + "%";
  }

  onProgressSet(e) {
    var requested = e.detail;
    if (requested.id == this.id) {
      this.set(requested.percentage);
    }
  }

  bind() {
    this.bindElement(document.body, "progress:set", this.onProgressSet.bind(this));
  }
  init() {
    this.bind();
  }
}

customElements.define("wdn-progress", WDNProgressBar);

// setup default settings

var settings = {
  useStorage: true,
  storage_prefix: "checkbox-",
  sendToCart: true,
};

var data_names = {
  checkbox: "data-checkbox",
  trigger: "data-checkbox-handler",
  accepted: "data-checkbox-accepted",
  error: "data-checkbox-error",
  checkout: "data-checkout",
};

var Terms = function (id, config) {
  this.id = id;
  this.forms = document.querySelectorAll("[" + data_names.checkbox + '="' + this.id + '"]');
  this.stateChangerList = document.querySelectorAll("[" + data_names.trigger + "]");
  this.accepted = false;
  this.storageName = settings.storage_prefix + this.id;
  this.checkouts = document.querySelectorAll("[" + data_names.checkout + "]");
  this.limitForUpdatingCartAttributes = 10;
  this.updateCartAttributeAttempts = 0;

  this.settings = settings;

  if (config) {
    this.settings = Object.assign(Object.assign({}, settings), config);
  }

  this.sendMessage = function () {
    /*
                  - Example event, @this.id = 'conditions',
                   - checkbox:conditions:update
              */

    this.forms.forEach(function (form) {
      form.dispatchEvent(
        new CustomEvent(
          "checkbox:" + this.id + ":update",
          {
            detail: {
              accepted: this.accepted,
            },
          },
          this
        )
      );
    }, this);
  };

  this.saveInStorage = function () {
    if (settings.useStorage) {
      localStorage.setItem(this.storageName, this.accepted);
    }
  };

  this.saveInCartAttributes = function () {
    if (settings.sendToCart) {
      if (this.updateCartAttributeAttempts > this.limitForUpdatingCartAttributes) {
        console.warn("Stop spamming!");
        return;
      }

      var req = new XMLHttpRequest();

      var url = "/cart.js";

      var accepted = "";

      if (this.accepted) {
        accepted = "true";
      }

      var params = {
        attributes: {
          _accepted_terms: accepted,
        },
      };

      req.open("POST", url, true);

      req.setRequestHeader("Content-type", "application/json");
      req.send(JSON.stringify(params));

      this.updateCartAttributeAttempts += 1;
    }
  };

  this.loadFromStorage = function () {
    if (settings.useStorage) {
      var savedValue = localStorage.getItem(this.storageName);

      if (savedValue !== null) {
        var newValue = true;

        if (localStorage.getItem(this.storageName) === "false") {
          newValue = false;
        }

        this.accepted = newValue;
        this.onStateChange();
      }
    }
  };

  this.setCheckoutState = function (newState) {
    this.checkouts.forEach(function (checkout) {
      checkout.disabled = newState;
    });
  };

  this.setFormAttribute = function (attr, value) {
    this.forms.forEach(function (form) {
      form.setAttribute(attr, value);
    });
  };

  this.removeFormAttribute = function (attr) {
    this.forms.forEach(function (form) {
      form.removeAttribute(attr);
    });
  };

  this.setState = function () {
    this.setFormAttribute(data_names.accepted, this.accepted);
    this.setCheckoutState(!this.accepted);
    if (this.accepted) {
      this.clearErrorState();
    }

    this.saveInCartAttributes();
    this.saveInStorage();
  };

  this.onStateChange = function () {
    this.setState();
    this.sendMessage();
  };

  this.handleStateChange = function () {
    this.accepted = !this.accepted;
    this.onStateChange();
  };

  this.clearErrorState = function () {
    this.removeFormAttribute(data_names.error);
  };

  this.setErrorState = function () {
    if (!this.accepted) {
      this.setFormAttribute(data_names.error, "");
    }
  };

  this.stateChangerList.forEach(function (item) {
    item.addEventListener("click", this.handleStateChange.bind(this));
  }, this);

  this.init = function () {
    this.loadFromStorage();
  };

  this.init();
};

if (typeof WDN.SwiperConfig === "undefined") {
  WDN.SwiperConfig = (function () {
    var defaultConfig = {
      // default desktop
      speed: 525,
      perView: 4,
      spaceBetween: 20,
      // default tablet
      tabletPerView: 2,
      tabletSpaceBetween: 15,
      // default mobile
      mobilePerView: 1,
      mobileSpaceBetween: 10,
    };
    return defaultConfig;
  })();
}

class WDNSwiper extends HTMLElement {
  constructor() {
    super();
    this.isCreated = false;
    this.default = WDN.SwiperConfig;
    this.id = this.getAttribute("data-id");
    this.perView = this.getAttribute("data-perview").split("-"); // eg. 3-2-1
    this.spaceBetween = this.getAttribute("data-space-between").split("-"); // eg. 50-20-10
    this.isMobileOnly = this.getAttribute("data-mobileonly") === "";
    this.isCenteredOnMobile = this.getAttribute("data-mobile-centered") === "";
    this.isCentered = this.getAttribute("data-centered") === "";
    this.isLooped = this.getAttribute("data-loop") === "";
    this.slidesPerGroup = parseInt(this.getAttribute("data-group-slides")) || 1;
    this.autoplay = this.getAttribute("data-autoplay") === "";
    this.init();
    console.log(this.Swiper);
  }

  createSwiper() {
    if (!this.isCreated) {
      this.isCreated = true;
      this.Swiper = new Swiper('wdn-swiper[data-id="' + this.id + '"]', {
        // Optional parameters
        loop: this.isLooped,
        slidesPerView: 1,
        spaceBetween: this.default.spaceBetween,
        centeredSlides: this.isCentered,
        touchStartPreventDefault: false,
        speed: 750,
        autoplay: this.autoplay,
        watchSlidesVisibility: true,
        watchSlidesProgress: true,

        // Pagination
        pagination: {
          el: '[data-swiper-pagination="' + this.id + '"]',
          clickable: true,
        },
        // Navigation arrows
        navigation: {
          prevEl: '[data-swiper-prev="' + this.id + '"]',
          nextEl: '[data-swiper-next="' + this.id + '"]',
        },

        // Responsiveness
        breakpoints: {
          //  > 200
          200: {
            slidesPerView: parseInt(this.perView[2]) || this.default.mobilePerView,
            centeredSlides: this.isCenteredOnMobile,

            spaceBetween: this.spaceBetween[2] || this.default.mobileSpaceBetween,
          },
          // > 620
          620: {
            slidesPerView: parseInt(this.perView[1]) || this.default.tabletPerView,
            spaceBetween: this.spaceBetween[1] || this.default.tabletSpaceBetween,
          },
          // > 1024
          1024: {
            slidesPerView: parseInt(this.perView[0]) || this.default.perView,
            spaceBetween: this.spaceBetween[0] || this.default.spaceBetween,
            allowTouchMove: !this.isMobileOnly,
            slidesPerGroup: this.slidesPerGroup,
            autoplay: !this.autoplay,
          },
        },
      });
    }
  }

  init() {
    this.createSwiper();
  }
}

customElements.define("wdn-swiper", WDNSwiper);

var checkboxTerms = new Terms("cart-summary", {
  sendToCart: false,
});

if (checkboxTerms) {
  var validateIfCheckboxTermsAccepted = function (form) {
    if (!checkboxTerms.accepted) {
      form.preventDefault();

      checkboxTerms.setErrorState();
    }
  };
}

/* QUICK ADD BUTTON  */

class WDNQuickAddBtn extends WDN.Component {
  constructor() {
    super();
    this.id = this.getAttribute("data-id");
    this.cart_drawer_form = document.querySelector("wdn-cart-form");
    this.quantity_modal = document.querySelector("wdn-modal[data-id='quantity_modal']");
    this.isClicked = false;
    this.init();
  }

  setCardAttribute(newState) {
    if (newState) {
      this.card.setAttribute("data-quickadd-active", "");
    } else {
      this.card.removeAttribute("data-quickadd-active");
    }
  }

  setupGlobalListeners() {
    if (this.isClicked) {
      this.addGlobalListeners();
    } else {
      this.removeGlobalListeners();
    }
  }

  resetQuantityInput() {
    if (this.quantityModule) {
      this.quantityModule.set(1);
    }
  }

  setState(newState) {
    if (!this.card) {
      return;
    }
    this.setCardAttribute(newState);
    this.isClicked = newState;
    this.setupGlobalListeners();
    if (!this.isClicked) {
      setTimeout(
        function () {
          this.resetQuantityInput();
        }.bind(this),
        200
      );
    }
  }

  addGlobalListeners() {
    this.bindElement(document.body, "click", this.bodyOnClickBound);
  }

  removeGlobalListeners() {
    this.unbindElement(document.body, "click", this.bodyOnClickBound);
  }

  onClick(e) {
    e ? e.preventDefault() : "";
    this.setState(!this.isClicked);
  }

  assignProductCard() {
    var cards = document.querySelectorAll("[data-product-card='" + this.id + "']");
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].contains(this)) {
        this.card = cards[i];
        return;
      }
    }
  }

  setSubmitButtonState(newState) {
    newState = newState ? newState : "default";
    this.submitButton.setAttribute("data-label-show", newState);
  }

  assignNodes() {
    this.assignProductCard();
    if (!this.card) {
      return;
    }
    this.form = this.card.querySelector("wdn-product-form");
    this.form.onFormError = this.onFormError.bind(this);
    this.form.onFormSuccess = this.onFormSuccess.bind(this);
    this.quantityContent = this.card.querySelector("[data-quantity-content]");
    this.popupCloser = this.card.querySelector("[data-popup-close]");
    this.submitButton = this.form.querySelector("[data-product-add]");
    this.quantityModule = this.form.querySelector("wdn-quantity");
  }

  resetSubmitButtonState() {
    setTimeout(
      function () {
        this.setSubmitButtonState("default");
      }.bind(this),
      1500
    );
  }

  onFormError() {
    this.setSubmitButtonState("error");
    this.resetSubmitButtonState();
  }

  resetPopupState() {
    setTimeout(
      function () {
        this.setState(false);
      }.bind(this),
      1800
    );
  }

  onFormSuccess() {
    this.setSubmitButtonState("success");
    this.resetPopupState();
    this.resetSubmitButtonState();
  }

  submitOnClick() {
    this.setSubmitButtonState("loading");
  }

  bodyOnClick(e) {
    if (!this.card.contains(e.target)) {
      this.setState(false);
    }
  }

  onCloserOnClick() {
    this.setState(false);
  }

  bind() {
    this.bodyOnClickBound = this.bodyOnClick.bind(this);
    this.bindElement(this, "click", this.onClick.bind(this));
    this.bindElement(this.submitButton, "click", this.submitOnClick.bind(this));
    this.bindElement(this.popupCloser, "click", this.onCloserOnClick.bind(this));
  }

  init() {
    this.assignNodes();
    this.bind();
  }
}

customElements.define("wdn-quickadd-button", WDNQuickAddBtn);
