/*

Build product page
new Instance(); // returns object

Get current variant
Instance.currentVariant.get(); // returns variant object

Get discount on current variant
Instance.discount.get(); // returns discount %

Set custom discount %
Instance.discount.set(perc); // updates discount DOM containers to @perc
-eg. Instance.discount.set(20); // sets to 20%

Update price DOM elements
Instance.price.setOriginal(nmr); // updates price DOM containes to @nmr value
-eg. Instance.price.setOriginal(200) // sets price to 200[ currency ]

Update compare at price DOM elements
Instance.price.setCompare(nmr); // updates compare price DOM containers to @nmr value
-eg. Instance.price.setCompare(300) // sets compare price to 300[ currency ]

Enable add to cart button
Instance.addToCart.enable();

Disable add to cart button
Instance.addToCart.disable();

Set loading to add to cart button
Instance.addToCart.setLoading(); // adds [data-loading] to button

Clear loading to add to cart button
Instance.addToCart.clearLoading(); // removes [data-loading] from the button 

Quantity set value
Instance.quantity.set(nmr); // sets quantity's input to @nmr value

Set stock status
Instance.stock.set(status);
@status -> "high, low, unavailable"
-eg. Instance.stock.set("low"); // sets stock level to "low"


Add current variant to cart
Instance.cart.add(qty); // adds current variant to cart, @qty is optional, default: 1
-eg. Instance.cart.add(); // adds current variant to cart, with quantity of 1

*/

// Production steps of ECMA-262, Edition 6, 22.1.2.1
if (!Array.from) {
  Array.from = (function () {
    var symbolIterator;
    try {
      symbolIterator = Symbol.iterator
        ? Symbol.iterator
        : "Symbol(Symbol.iterator)";
    } catch (e) {
      symbolIterator = "Symbol(Symbol.iterator)";
    }

    var toStr = Object.prototype.toString;
    var isCallable = function (fn) {
      return typeof fn === "function" || toStr.call(fn) === "[object Function]";
    };
    var toInteger = function (value) {
      var number = Number(value);
      if (isNaN(number)) return 0;
      if (number === 0 || !isFinite(number)) return number;
      return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
    };
    var maxSafeInteger = Math.pow(2, 53) - 1;
    var toLength = function (value) {
      var len = toInteger(value);
      return Math.min(Math.max(len, 0), maxSafeInteger);
    };

    var setGetItemHandler = function setGetItemHandler(isIterator, items) {
      var iterator = isIterator && items[symbolIterator]();
      return function getItem(k) {
        return isIterator ? iterator.next() : items[k];
      };
    };

    var getArray = function getArray(T, A, len, getItem, isIterator, mapFn) {
      // 16. Let k be 0.
      var k = 0;

      // 17. Repeat, while k < len… or while iterator is done (also steps a - h)
      while (k < len || isIterator) {
        var item = getItem(k);
        var kValue = isIterator ? item.value : item;

        if (isIterator && item.done) {
          return A;
        } else {
          if (mapFn) {
            A[k] =
              typeof T === "undefined"
                ? mapFn(kValue, k)
                : mapFn.call(T, kValue, k);
          } else {
            A[k] = kValue;
          }
        }
        k += 1;
      }

      if (isIterator) {
        throw new TypeError(
          "Array.from: provided arrayLike or iterator has length more then 2 ** 52 - 1"
        );
      } else {
        A.length = len;
      }

      return A;
    };

    // The length property of the from method is 1.
    return function from(arrayLikeOrIterator /*, mapFn, thisArg */) {
      // 1. Let C be the this value.
      var C = this;

      // 2. Let items be ToObject(arrayLikeOrIterator).
      var items = Object(arrayLikeOrIterator);
      var isIterator = isCallable(items[symbolIterator]);

      // 3. ReturnIfAbrupt(items).
      if (arrayLikeOrIterator == null && !isIterator) {
        throw new TypeError(
          "Array.from requires an array-like object or iterator - not null or undefined"
        );
      }

      // 4. If mapfn is undefined, then let mapping be false.
      var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
      var T;
      if (typeof mapFn !== "undefined") {
        // 5. else
        // 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
        if (!isCallable(mapFn)) {
          throw new TypeError(
            "Array.from: when provided, the second argument must be a function"
          );
        }

        // 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
        if (arguments.length > 2) {
          T = arguments[2];
        }
      }

      // 10. Let lenValue be Get(items, "length").
      // 11. Let len be ToLength(lenValue).
      var len = toLength(items.length);

      // 13. If IsConstructor(C) is true, then
      // 13. a. Let A be the result of calling the [[Construct]] internal method
      // of C with an argument list containing the single item len.
      // 14. a. Else, Let A be ArrayCreate(len).
      var A = isCallable(C) ? Object(new C(len)) : new Array(len);

      return getArray(
        T,
        A,
        len,
        setGetItemHandler(isIterator, items),
        isIterator,
        mapFn
      );
    };
  })();
}

var WDN = WDN || {};

if (typeof WDN.ProductPage === "undefined") {
  WDN.ProductPage = (function () {
    var ProductPage;

    var config = {
      runOnLoad: false, // starts script automatically on load
    };

    // Product & variant information, passed down from liquid
    var initialData = WDN.ProductPageConfig;

    // List of selectors
    var selectors = {
      product_page: "[data-productpage]",
      product_script: "[data-product-script]",
      product_price: "[data-product-price]",
      product_compare_price: "[data-product-compareprice]",
      product_form: "[data-product-form]",
      product_quantity: "wdn-quantity",
      discount_badge: "[data-discount-badge]",
      discount_saving: "[data-discount-saving]",
      stock_status: "[data-product-stock]",
      add_to_cart: "[data-product-add]",
      variant_title: "[data-variant-title]",
      variant_select: "[data-variant-select]",
      variant_stock: "[data-variant-stocks]",
      select_ghost: "[data-ghost-select]", // ghost input
      quantity_ghost: "[data-ghost-quantity]", // ghost input
    };

    // List of modules that will be automatically selected
    var modules = {
      product_page: selectors.product_page,
      product_price: selectors.product_price,
      product_compare_price: selectors.product_compare_price,
      product_form: selectors.product_form,
      product_quantity: selectors.product_quantity,
      discount_badge: selectors.discount_badge,
      discount_saving: selectors.discount_saving,
      stock_status: selectors.stock_status,
      add_to_cart: selectors.add_to_cart,
      variant_title: selectors.variant_title,
      variant_select: selectors.variant_select,
      variant_stock: selectors.variant_stock,
      select_ghost: selectors.select_ghost,
      quantity_ghost: selectors.quantity_ghost,
    };

    ProductPage = function () {
      var _this = this;
      this.product = JSON.parse(
        document.querySelector(selectors.product_script).innerText
      ); // gets product JSON dump
      this.nodes = {}; // will be filled on init

      /* ADD TO CART */
      this.addToCart = {
        setLoading: function () {
          var parentContainer = _this.nodes.product_page[0]; // the most outer container
          _this.nodes.add_to_cart.forEach(function (button) {
            button.setAttribute("data-loading", "");
          });
          if (parentContainer) {
            parentContainer.setAttribute("data-loading", "");
          }
        },
        clearLoading: function () {
          var parentContainer = _this.nodes.product_page[0];
          _this.nodes.add_to_cart.forEach(function (button) {
            button.removeAttribute("data-loading");
          });
          if (parentContainer) {
            parentContainer.removeAttribute("data-loading");
          }
        },

        setUnavailable: function () {
          this.disable();
          _this.nodes.add_to_cart.forEach(function (button) {
            button.setAttribute("data-unavailable", "");
          });
        },

        setAvailable: function () {
          this.enable();
          _this.nodes.add_to_cart.forEach(function (button) {
            button.removeAttribute("data-unavailable");
          });
        },
        disable: function () {
          _this.nodes.add_to_cart.forEach(function (button) {
            button.disabled = true;
          });
        },
        enable: function () {
          _this.nodes.add_to_cart.forEach(function (button) {
            button.disabled = false;
          });
        },
      };

      /* DISCOUNT */
      this.discount = {
        values: {
          percentage: 0, // initial state, will be populated on init
          savings: 0,
        },

        // init function, displays discount based on initial data
        init: function () {
          var initialDiscountPerc = initialData.discount.percentage;
          var initialSavings = initialData.discount.savings;
          this.setPercentage(initialDiscountPerc);
          this.setSavings(initialSavings);
        },

        get: function () {
          return this.values;
        },

        // updates discount based on selected variant
        update: function () {
          var updatedPercentage = this.calculatePercentage();
          var updatedSavings = this.calculateSavings();
          this.setPercentage(updatedPercentage);
          this.setSavings(updatedSavings);
          this.toggle();
        },

        // shows/hides containers if there is no discount/savings
        toggle: function () {
          if (this.values.percentage < 1 || this.values.savings < 1) {
            this.hide();
          } else {
            this.show();
          }
        },

        setPercentage: function (percentage) {
          _this.loopAndInsert({
            array: _this.nodes.discount_badge,
            content: percentage + "%",
          });
          this.values.percentage = percentage;
          this.toggle();
        },

        setSavings: function (savings) {
          var savingsWCurrency = WDN.Money.Format(savings);
          _this.loopAndInsert({
            array: _this.nodes.discount_saving,
            content: savingsWCurrency,
          });
          this.values.savings = savings;
          this.toggle();
        },

        // calculates discount based on selected variant
        calculatePercentage: function () {
          var percentage = 0;
          var currentVariant = _this.currentVariant.get();
          // if compare price is not null and if product is actually on discount
          if (
            currentVariant.compare_at_price &&
            currentVariant.price < currentVariant.compare_at_price
          ) {
            var difference =
              (currentVariant.price / currentVariant.compare_at_price) * 100;
            percentage = Math.round(100 - difference);
          }
          return percentage;
        },

        calculateSavings: function () {
          var savings = 0;
          var currentVariant = _this.currentVariant.get();
          if (
            currentVariant.compare_at_price &&
            currentVariant.price < currentVariant.compare_at_price
          ) {
            var discount = this.calculatePercentage();
            priceDifference =
              currentVariant.compare_at_price -
              (currentVariant.compare_at_price * discount) / 100;
            savings = currentVariant.compare_at_price - priceDifference;
          }
          return savings;
        },

        show: function () {
          _this.nodes.discount_badge.forEach(function (badge) {
            badge.removeAttribute("data-hide");
            badge.setAttribute("data-onsale", "");
          });
          _this.nodes.discount_saving.forEach(function (saving) {
            saving.removeAttribute("data-hide");
            saving.setAttribute("data-onsale", "");
          });
        },

        hide: function () {
          _this.nodes.discount_badge.forEach(function (badge) {
            badge.setAttribute("data-hide", "");
          });
          _this.nodes.discount_saving.forEach(function (saving) {
            saving.setAttribute("data-hide", "");
          });
        },
      };

      /* PRICE */
      this.price = {
        values: {
          original: "",
          compare: "",
        },
        // sets original price eg. this.setOriginal(20); // 20dkk
        setOriginal: function (value) {
          var value = (value || 0) * 100;
          _this.loopAndInsert({
            array: _this.nodes.product_price,
            content: WDN.Money.Format(value),
          });
          this.values.original = value;
        },

        // sets compare price eg. this.setCompare(30); // 30dkk
        setCompare: function (value) {
          var value = (value || 0) * 100;
          _this.loopAndInsert({
            array: _this.nodes.product_compare_price,
            content: WDN.Money.Format(value),
          });
          this.values.compare = value;
        },

        // hides compare price if lower than original price
        toggleVisibility: function () {
          // compares current original and compare price
          if (this.values.original > this.values.compare) {
            this.hideCompare();
          } else {
            this.showCompare();
          }
        },
        // hides compare price container(s)
        hideCompare: function () {
          _this.nodes.product_compare_price.forEach(function (container) {
            container.setAttribute("data-hide", "");
          });
        },

        // shows compare price container(s)
        showCompare: function () {
          _this.nodes.product_compare_price.forEach(function (container) {
            container.removeAttribute("data-hide");
          });
        },

        // updates prices based on selected variant
        update: function () {
          var currentVariant = _this.currentVariant.get();
          // divided by 100 because output is in shopify's format
          this.setOriginal(currentVariant.price / 100);
          this.setCompare(currentVariant.compare_at_price / 100);
          // shows/hides compare price based on current price > compare price
          this.toggleVisibility();
        },

        init: function () {
          this.update();
        },
      };

      /* VARIANT SELECT */
      this.variantSelect = {
        init: function () {
          _this.nodes.variant_select.forEach(function (select) {
            select.addEventListener("change", this.onChange.bind(this));
          }, this);
        },

        // Returns selected value(s) from variant input(s) as a variant title
        getSelectedValue: function () {
          var valueList = [];
          _this.nodes.variant_select.forEach(function (select) {
            var selectedIndex = select.selectedIndex;
            var selectedOption = select.options[selectedIndex].value;
            valueList.push(selectedOption);
          });
          return valueList.join(" / ");
        },
        // sets current variant through variant select
        set: function (variantTitle) {
          var select = _this.nodes.variant_select[0];
          var option = select.querySelector(
            "option[value='" + variantTitle + "']"
          );
          if (select && option) {
            option.selected = true;
            this.onChange();
          }
        },

        onChange: function () {
          this.fireOnChangeEvent();
        },

        // sets selected variant id as ghost input value
        updateGhostInput: function () {
          var input = _this.nodes.select_ghost[0];
          if (input) {
            var currentVariant = _this.currentVariant.get();
            input.value = currentVariant.id;
          }
        },

        fireOnChangeEvent: function () {
          var variantTitle = this.getSelectedValue();
          _this.fireCustomEvent({
            name: "variant:change",
            detail: { variantTitle: variantTitle },
          });
        },
      };

      /* CURRENT VARIANT */
      this.currentVariant = {
        data: "",
        init: function () {
          var initialSelection = _this.variantSelect.getSelectedValue();
          this.set(initialSelection);
        },
        // Sets state on the button, based on availbility
        validateAvailability: function () {
          var currentVariant = this.get();
          if (currentVariant.available) {
            _this.addToCart.setAvailable();
          } else {
            _this.addToCart.setUnavailable();
          }
        },

        get: function () {
          return this.data;
        },

        // sets current variant (works only for 1 option)
        set: function (variantTitle) {
          if (variantTitle) {
            this.data = _this.variant.find(variantTitle);
            this.validateAvailability();
          }
          return this.data;
        },
      };

      /* VARIANT */
      this.variant = {
        // finds variant based on its title
        find: function (list) {
          var foundVariant = false;
          _this.product.variants.forEach(function (variant) {
            if (variant.title == list) {
              foundVariant = variant;
              return;
            }
          });
          return foundVariant;
        },

        updateTitle: function () {
          var currentVariant = _this.currentVariant.get();
          _this.loopAndInsert({
            array: _this.nodes.variant_title,
            content: currentVariant.title,
          });
        },
      };

      /* STOCK */
      this.stock = {
        data: "", // will be populated dynamically
        init: function () {
          var script = _this.nodes.variant_stock[0];
          if (script) {
            this.data = JSON.parse(script.innerText);
          }
        },

        set: function (value) {
          _this.nodes.stock_status.forEach(function (status) {
            status.setAttribute("data-product-stock", value);
          });
        },
        find: function (title) {
          return this.data[title];
        },

        update: function () {
          var config = WDN.ProductPageConfig.stock;
          var hasTracking = config.hasTracking;
          if (hasTracking) {
            var currentVariant = _this.currentVariant.get();
            if (!currentVariant.available) {
              this.set("unavailable");
            } else {
              var newStatus = this.find(currentVariant.title); // gets stock info based on variant title
              this.set(newStatus);
            }
          }
        },
      };

      /* URL */
      this.url = {
        update: function () {
          var currentVariant = _this.currentVariant.get();
          var params = "?variant=" + currentVariant.id;
          window.history.pushState("", "", params);
        },
      };

      /* QUANTITY */
      this.quantity = {
        set: function (qty) {
          var input = _this.nodes.product_quantity[0];
          input.value = qty;
          this.updateGhostInput();
        },

        getValue: function () {
          var input = _this.nodes.product_quantity[0];
          var value = 1; // if input does not exist, default qty value is 1
          if (input) {
            value = parseInt(input.value);
          }
          return value;
        },

        validate: function () {
          var currentValue = this.getValue();
          if (currentValue && currentValue > 0) {
            _this.addToCart.enable();
          } else {
            _this.addToCart.disable();
          }
        },

        // sets selected variant id as ghost input value
        updateGhostInput: function () {
          var ghostInput = _this.nodes.quantity_ghost[0];
          if (ghostInput) {
            ghostInput.value = this.getValue();
          }
        },
      };

      this.init();
    };

    // Helper function for sending custom events
    ProductPage.prototype.fireCustomEvent = function (obj) {
      var target = obj.target || document.body;
      var event = new CustomEvent(obj.name, {
        detail: obj.detail,
      });
      target.dispatchEvent(event);
    };

    // helper function for inserting value in nodelist
    ProductPage.prototype.loopAndInsert = function (obj) {
      obj.array.forEach(function (item) {
        item.innerHTML = obj.content;
      });
    };

    // fires on variant change
    ProductPage.prototype.onVariantChange = function (e) {
      // returns selected value from variant select
      var selectedValue = this.variantSelect.getSelectedValue();
      this.currentVariant.set(selectedValue);
      // updates elements based on current variant
      // adds selected variant id to url
      this.url.update();
      // updates variant title
      this.variant.updateTitle();
      this.quantity.validate();
      this.variantSelect.updateGhostInput();
      // updates and toggles discount based on on calculations
      this.discount.update();
      // updates price and compare price
      this.price.update();
      // updates stock status
      this.stock.update();
    };

    ProductPage.prototype.listenForVariantChange = function () {
      if (this.nodes.variant_select.length > 0) {
        document.body.addEventListener(
          "variant:change",
          this.onVariantChange.bind(this)
        );
      }
    };

    ProductPage.prototype.serializeForm = function (form) {
      return Array.from(new FormData(form), function (e) {
        return e.map(encodeURIComponent).join("=");
      }).join("&");
    };

    ProductPage.prototype.sendFormRequest = function () {
      var form = this.nodes.product_form[0];
      if (form) {
        var formData = this.serializeForm(form);
        WDN.Request.Post({
          url: "/cart/add.js",
          data: formData,
          contentType: "multipart/form-data",
          onSuccess: function (res) {
            // success callback
            this.addToCart.clearLoading();
            this.fireCustomEvent({
              name: "cart:add",
              detail: res,
            });
          }.bind(this),
          onError: function (res) {
            // error callback
            this.addToCart.clearLoading();
            this.fireCustomEvent({
              name: "cart:error",
              detail: res,
            });
          }.bind(this),
        });
      }
    };

    ProductPage.prototype.onAddToCart = function (e) {
      e ? e.preventDefault() : "";
      this.addToCart.setLoading();
      this.sendFormRequest();
    };

    ProductPage.prototype.listenForAddToCart = function () {
      var buttons = this.nodes.add_to_cart;
      buttons.forEach(function (button) {
        button.addEventListener("click", this.onAddToCart.bind(this));
      }, this);
    };

    // fires on quantity input change
    ProductPage.prototype.quantityOnChange = function (e) {
      this.quantity.validate();
      this.quantity.updateGhostInput();
    };

    ProductPage.prototype.listenForQuantityChange = function () {
      var input = this.nodes.product_quantity[0];
      if (input) {
        input.onQuantityChange = this.quantityOnChange.bind(this);
      }
    };

    ProductPage.prototype.bind = function () {
      this.listenForVariantChange();
      this.listenForQuantityChange();
      this.listenForAddToCart();
    };

    // autobuilds page features
    ProductPage.prototype.build = function () {
      this.currentVariant.init();
      this.price.init();
      this.discount.init();
      this.variantSelect.init();
      this.stock.init();
      this.url.update();
    };

    // Auto generates nodes from modules object
    ProductPage.prototype.assignModules = function () {
      for (var key in modules) {
        if (modules.hasOwnProperty(key)) {
          var query = modules[key];
          this.nodes[key] = document.querySelectorAll(query);
        }
      }
    };

    ProductPage.prototype.init = function () {
      this.assignModules();
      this.build();
      this.bind();
    };

    if (config.runOnLoad) {
      new ProductPage();
    }

    return ProductPage;
  })();
}


