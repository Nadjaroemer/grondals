var WDN = WDN || {};

if (typeof WDN.VariantSelect === "undefined") {
  WDN.VariantSelect = (function () {
    class VariantSelect extends HTMLElement {
      constructor() {
        super();

        // Price containers
        this.priceContainer = document.querySelector("[data-product-info] [data-product-price]");
        this.comparePriceContainer = document.querySelector("[data-product-info] [data-product-compareprice]");
        // Form
        this.productForm = document.querySelector("[data-product-info] [data-product-form]");
        this.ghostSelect = this.productForm.querySelector("[data-ghost-select]");
        // Options
        this.options = Array.from(this.querySelectorAll("[data-variant-id]"));
        this.activeOption = false;
        // Dump
        this.variantDump = JSON.parse(document.querySelector("[data-variant-dump]").innerText);

        if (!this.ghostSelect || !this.variantDump) return;

        this.init();
      }

      setVariantParam() {
        var variantID = this.getSelectedVariantId();
        if (!variantID) return;
        var currentParams = new URLSearchParams(window.location.search);
        currentParams.set("variant", variantID);
        window.history.replaceState("", "", "?" + currentParams.toString());
      }

      getSelectedVariantDump() {
        var variantID = this.getSelectedVariantId();
        if (!variantID) return false;
        return this.variantDump[variantID] || false;
      }

      updatePrices() {
        var variantDump = this.getSelectedVariantDump();
        if (!variantDump) return;

        var variantOnDiscount = variantDump.comparePrice > variantDump.price;

        // Toggle discount visibility
        var classListAction = variantOnDiscount ? "remove" : "add";
        if (this.comparePriceContainer) {
          this.comparePriceContainer.classList[classListAction]("hide");
        }

        // Fill containers
        this.priceContainer.innerHTML = WDN.Money.format(variantDump.price);
        
        if (this.comparePriceContainer) {
         this.comparePriceContainer.innerHTML = WDN.Money.format(variantDump.comparePrice);
        }
      }

      updateGhostInput() {
        var variantId = this.getSelectedVariantId();
        if (!variantId) return;
        this.ghostSelect.setAttribute("value", variantId);
      }

      getSelectedVariantId() {
        if (!this.activeOption) return false;
        return this.activeOption.getAttribute("data-variant-id");
      }

      clearActiveOption() {
        if (!this.activeOption) return;
        this.activeOption.removeAttribute("data-selected");
      }

      setActiveOption(target) {
        if (!target) return;
        this.activeOption = target;
        target.setAttribute("data-selected", "");
      }

      optionOnClick(e) {
        this.clearActiveOption();
        this.setActiveOption(e.currentTarget);
        this.setVariantParam();
        this.updatePrices();
        this.updateGhostInput();
      }

      assignActiveOption() {
        this.activeOption =
          this.options.filter(function (option) {
            return option.getAttribute("data-selected") === "";
          })[0] || false;
      }

      bind() {
        this.options.forEach(function (option) {
          option.addEventListener("click", this.optionOnClick.bind(this));
        }, this);
      }

      init() {
        this.assignActiveOption();
        this.bind();
      }
    }

    customElements.define("variant-select", VariantSelect);
  })();
}
