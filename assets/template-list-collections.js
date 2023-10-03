var WDN = WDN || {};

if (typeof WDN.HeaderHeight === "undefined") {
  WDN.HeaderHeight = (function () {
    var get = function () {
      var root_style = document.documentElement.style;
      var header_height = parseInt(root_style.getPropertyValue("--header-height-no-announcement"));
      var collection_nav_height = parseInt(root_style.getPropertyValue("--collection-nav-height"));
      return header_height + collection_nav_height;
    };

    return {
      get,
    };
  })();
}

if (typeof WDN.CollectionNavigation === "undefined") {
  WDN.CollectionNavigation = (function () {
    var init, bind, store_nav_height, set_variable;
    var window_on_scroll, store_targets_position, window_on_resize;
    var set_active_section, clear_active_section, on_dropdown_toggle;

    var nodes = {
      sticky_navigation: document.querySelector("[data-collection-navigation]"),
      sticky_navigation_grid: document.querySelector("[data-collection-navigation-grid]"),
      scroll_links: document.querySelectorAll("wdn-scroll-link"),
      scroll_targets: document.querySelectorAll("wdn-scroll-target"),
    };

    var scroll_target_positions = [];

    var data = {
      active_section: false,
    };

    var config = {
      horizontal_nav_scroll: false, // "follows" active link
      scroll_offset: 10, // if we want to trigger function a bit earlier
    };

    set_variable = function (name, value) {
      document.documentElement.style.setProperty(name, value);
    };

    store_nav_height = function () {
      set_variable("--collection-nav-height", nodes.sticky_navigation.offsetHeight + "px");
    };

    store_targets_position = function () {
      scroll_target_positions = [];
      nodes.scroll_targets.forEach(function (target, i) {
        var target_rect = target.getBoundingClientRect();
        var top_start = target_rect.top + window.scrollY - config.scroll_offset; // target_rect.top + window.pageYOffset - config.scroll_offset;
        var link = nodes.scroll_links[i];
        var link_rect = link.getBoundingClientRect();
        scroll_target_positions.push({
          top_start: top_start,
          top_end: top_start + target.offsetHeight,
          target: target,
          link: link,
          link_left: link_rect.left,
        });
      });
    };

    clear_active_section = function () {
      if (!data.active_section) return;
      data.active_section.link.classList.remove("collection_link--active");
      data.active_section = false;
    };

    set_active_section = function (section) {
      if (data.active_section == section) return;
      clear_active_section();
      section.link.classList.add("collection_link--active");
      data.active_section = section;

      if (config.horizontal_nav_scroll) {
        nodes.sticky_navigation_grid.scroll(section.link_left - 20, 0);
      }
    };

    window_on_scroll = function () {
      var header_height = WDN.HeaderHeight.get();
      for (var i = 0; i < scroll_target_positions.length; i++) {
        var section = scroll_target_positions[i];
        var scroll_position = window.scrollY + header_height;

        // if scroll position less than fist target - clear active
        if (scroll_position < scroll_target_positions[0].top_start) {
          clear_active_section();
          break;
        }
        // if scroll position in between target
        if (scroll_position >= section.top_start && scroll_position <= section.top_end) {
          set_active_section(section);
          break;
        }

        // if scroll position less than last target - clear active
        if (scroll_position > scroll_target_positions[scroll_target_positions.length - 1].top_end) {
          clear_active_section();
          break;
        }
      }
    };

    window_on_resize = function () {
      store_nav_height();
      store_targets_position();
    };

    on_dropdown_toggle = function (e) {
      var dropdown = e.detail;
      window_on_resize();
      window_on_scroll();
    };

    bind = function () {
      document.addEventListener("dropdown:toggled", on_dropdown_toggle);
      window.addEventListener("resize", window_on_resize);
      window.addEventListener("scroll", window_on_scroll);
    };

    init = function () {
      if (!nodes.sticky_navigation) return;
      store_nav_height();
      store_targets_position();
      bind();
    };

    init();
  })();
}

class WDNScrollLink extends HTMLElement {
  constructor() {
    super();
    this.config = {
      scrollOffset: 180,
      headerHeight: WDN.HeaderHeight.get(),
    };
    this.targetId = this.getAttribute("data-target");
    this.target = this.getTargetById(this.targetId);
    this.init();
  }

  getTargetById(id) {
    return document.querySelector("wdn-scroll-target[data-id='" + id + "']");
  }

  reached_bottom() {
    return window.innerHeight + window.scrollY >= document.body.offsetHeight;
  }

  reached_top() {
    return window.scrollY == 0;
  }

  getElementTopPosition(element) {
    return element.getBoundingClientRect().top + window.pageYOffset - this.config.headerHeight;
  }

  scrollDown() {
    this.config.scrollOffset = this.getScrollOffset();
    this.isScrolling = true;
    var i = window.scrollY;
    this.Interval = setInterval(
      function () {
        window.scrollTo(0, i);
        i += this.config.scrollOffset;
        if (i >= this.elementTopPos || this.reached_bottom()) {
          clearInterval(this.Interval);
          window.scrollTo(0, this.elementTopPos);
          this.isScrolling = false;
        }
      }.bind(this),
      20
    );
  }

  scrollUp() {
    this.config.scrollOffset = this.getScrollOffset();
    this.isScrolling = true;
    var i = window.scrollY;
    this.Interval = setInterval(
      function () {
        window.scrollTo(0, i);
        i -= this.config.scrollOffset;
        if (i <= this.elementTopPos || this.reached_top()) {
          clearInterval(this.Interval);
          window.scrollTo(0, this.elementTopPos);
          this.isScrolling = false;
        }
      }.bind(this),
      20
    );
  }

  getScrollOffset() {
    var offset = this.elementTopPos / 2;

    if (offset > 1000) {
      offset = 140;
    }

    if (offset < 80 || offset > 200) {
      offset = 100;
    }

    return offset;
  }

  scrollTo(element) {
    if (!element || this.isScrolling) return;

    this.elementTopPos = this.getElementTopPosition(element);

    if (window.scrollY > this.elementTopPos) {
      this.scrollUp();
    } else {
      this.scrollDown();
    }
  }

  onClick(e) {
    e ? e.preventDefault() : "";
    this.scrollTo(this.target);
  }

  storeHeaderHeight() {
    this.config.headerHeight = parseInt(document.documentElement.style.getPropertyValue("--header-height")) || 0;
  }

  onHeaderHeightUpdate() {
    this.storeHeaderHeight();
  }

  bind() {
    this.addEventListener("click", this.onClick.bind(this));
    document.body.addEventListener("header_height:updated", this.onHeaderHeightUpdate.bind(this));
  }
  init() {
    if (!this.target) return;
    this.bind();
  }
}

class WDNScrollTarget extends HTMLElement {
  constructor() {
    super();
  }
}

customElements.define("wdn-scroll-link", WDNScrollLink);
customElements.define("wdn-scroll-target", WDNScrollTarget);
