var WDN = WDN || {};

if (typeof WDN.BlogFilters === "undefined") {
  WDN.BlogFilters = (function () {
    var init, create_instances, Filter;
    var bind, handle_render_event, render_layout;

    var config = {
      url: WDN.BlogFilterConfig.url,
      section_id: "blog",
      active_class: "filter_button--active",
    };

    var list = {};

    var nodes = {
      content: document.querySelector("[data-blog-content]"),
      buttons: document.querySelectorAll("[data-blog-filter]"),
    };

    Filter = function (button) {
      this.value = button.getAttribute("data-blog-filter");
      this.button = button;
      this.is_active = button.classList.contains(config.active_class);
      this.init();
    };

    Filter.prototype.get_request_url = function () {
      var url = config.url + "/tagged/" + this.value;
      if (this.value == "all") {
        url = config.url;
      }

      return url + "?section_id=" + config.section_id;
    };

    render_layout = function (content) {
      nodes.content.innerHTML = content;
    };

    Filter.prototype.active = function (state) {
      if (state) {
        this.clear_active_filter();
        this.button.classList.add(config.active_class);
      } else {
        this.button.classList.remove(config.active_class);
      }
      this.is_active = state;
    };

    Filter.prototype.clear_active_filter = function () {
      for (var key in list) {
        if (list.hasOwnProperty(key)) {
          if (list[key].is_active) {
            list[key].active(false);
            break;
          }
        }
      }
    };

    Filter.prototype.handle_fetch_success = function (res) {
      this.is_fetching = false;
      this.fetched_layout = res;
      render_layout(res);
      this.active(true);
    };

    Filter.prototype.handle_fetch_error = function () {
      this.is_fetching = false;
    };

    Filter.prototype.fetch_layout = function () {
      if (this.is_fetching) return;
      WDN.Request.Get({
        url: this.get_request_url(),
        onSuccess: this.handle_fetch_success.bind(this),
        onError: this.handle_fetch_error.bind(this),
      });
      this.is_fetching = true;
    };

    Filter.prototype.handle_button_click = function () {
      if (this.is_active) return;
      if (this.fetched_layout) {
        this.active(true);
        render_layout(this.fetched_layout);
      } else {
        this.fetch_layout();
      }
    };

    Filter.prototype.bind = function () {
      this.button.addEventListener("click", this.handle_button_click.bind(this));
    };

    Filter.prototype.init = function () {
      this.bind();
    };

    handle_render_event = function (e) {
      if (!e.detail) return;
      render_layout(e.detail);
    };

    create_instances = function () {
      nodes.buttons.forEach(function (button) {
        var value = button.getAttribute("data-blog-filter");
        list[value] = new Filter(button);
      });
    };

    bind = function () {
      document.body.addEventListener("blog:render", handle_render_event);
    };

    init = function () {
      bind();
      create_instances();
    };

    init();

    return {
      config,
    };
  })();
}

class WDNBlogPagination extends HTMLElement {
  constructor() {
    super();
    this.config = WDN.BlogFilters.config;
    this.url = this.getAttribute("data-url");
    this.init();
  }

  render_layout(content) {
    document.body.dispatchEvent(
      new CustomEvent("blog:render", {
        detail: content,
      })
    );
  }

  handle_fetch_success(res) {
    this.render_layout(res);
    this.is_fetching = false;
  }

  handle_fetch_error() {
    this.is_fetching = false;
  }

  fetch_layout() {
    if (this.is_fetching) return;
    WDN.Request.Get({
      url: this.url + "&section_id=" + this.config.section_id,
      onSuccess: this.handle_fetch_success.bind(this),
      onError: this.handle_fetch_error.bind(this),
    });
    this.is_fetching = true;
  }

  handle_click() {
    this.fetch_layout();
  }

  bind() {
    this.addEventListener("click", this.handle_click.bind(this));
  }

  init() {
    this.bind();
  }
}

customElements.define("wdn-blog-pagination", WDNBlogPagination);
