if (typeof WDN.Slide === "undefined") {
  WDN.Slide = (function () {
    var deselectActiveSliders;
    var Slide;
    var list = {};

    Slide = function (id) {
      this.id = id;
      this.slide = document.querySelector("[data-slide='" + id + "'");
      this.isActive = false;
      this.init();
      list[id] = this;
    };

    Slide.prototype.setInactive = function () {
      this.slide.removeAttribute("data-active");
      this.isActive = false;
    };

    Slide.prototype.setActive = function () {
      deselectActiveSliders();
      this.slide.setAttribute("data-active", "");
      this.isActive = true;
    };

    Slide.prototype.setInitialState = function () {
      this.isActive = this.slide.getAttribute("data-active") == "";
    };

    Slide.prototype.init = function () {
      this.setInitialState();
    };

    deselectActiveSliders = function () {
      for (var key in list) {
        if (list.hasOwnProperty(key)) {
          list[key].setInactive();
        }
      }
    };

    return Slide;
  })();
}

if (typeof WDN.NavDrawer === "undefined") {
  WDN.NavDrawer = (function () {
    // main
    var init, createSlides;
    // binds
    var bind, bindLinks, bindSidebarTriggers, bindSidebarClosers;
    // callbacks
    var sidebarTriggerOnHover, linkOnInteraction, sidebarCloserOnClick, drawerOnClose;
    // helpers
    var setActive, setInactive, clearActiveSidebar, clearActiveLink, getSlideId;
    // constructors
    var Slide = WDN.Slide;

    // will contain instances of slides
    var list = {};

    var selectors = {
      slide: "[data-slide]",
      link_click: "[data-click-to]",
      link_hover: "[data-hover-to]",
      sidebar_triggers: "[data-sidebar-show]",
      sidebar: "[data-nav-sidebar]",
      sidebar_closer: "[data-sidebar-close]",
      sidebar_group: "[data-sidebar-group]",
      sidebar_show: "[data-sidebar-show]",
      active: "[data-active]",
    };

    var nodes = {
      slides: document.querySelectorAll(selectors.slide),
      links_click: document.querySelectorAll(selectors.link_click),
      links_hover: document.querySelectorAll(selectors.link_hover),
      sidebar_triggers: document.querySelectorAll(selectors.sidebar_triggers),
      sidebar: document.querySelector(selectors.sidebar),
      sidebar_closers: document.querySelectorAll(selectors.sidebar_closer),
    };

    var config = {
      // desktop slider will be visible when greater this breakpoint
      sliderBreakpoint: 780,
    };

    var Sidebar = {};

    Sidebar.show = function () {
      nodes.sidebar ? nodes.sidebar.classList.remove("hide") : "";
    };

    Sidebar.hide = function () {
      nodes.sidebar ? nodes.sidebar.classList.add("hide") : "";
    };

    sidebarTriggerOnHover = function () {
      //clearActiveSidebar();
      clearActiveLink();
      var hasChildrenLinks = this.getAttribute("data-haslinks") == "";
      if (window.innerWidth > config.sliderBreakpoint || hasChildrenLinks) {
        Sidebar.show();
        var id = this.getAttribute("data-sidebar-show");
        var relatedSidebar = document.querySelector("[data-sidebar-group='" + id + "']");
        setActive(relatedSidebar);
        setActive(this);
      }
    };

    sidebarCloserOnClick = function (e) {
      e ? e.preventDefault() : "";
      Sidebar.hide();
      clearActiveLink();
    };

    clearActiveSidebar = function () {
      var activeSidebar = document.querySelector(selectors.slide + selectors.active);
      setInactive(activeSidebar);
    };
    var clearPrimaryLink = function () {
      var primaryLink = document.querySelector(".link--primary" + selectors.active);
      setInactive(primaryLink);
    };

    clearActiveLink = function () {
      var activeLink = document.querySelector(selectors.sidebar_show + selectors.active);
      setInactive(activeLink);
    };

    getSlideId = function (slide) {
      var id = slide ? slide.getAttribute("data-slide") : false;
      return id;
    };

    setActive = function (el) {
      var elementId = getSlideId(el);
      if (elementId && list[elementId]) {
        list[elementId].setActive();
      } else if (el) {
        el.setAttribute("data-active", "");
      }
    };

    setInactive = function (el) {
      var elementId = getSlideId(el);
      if (elementId && list[elementId]) {
        list[elementId].setInactive();
      } else if (el) {
        el.removeAttribute("data-active");
      }
    };

    linkOnInteraction = function (e) {
      //e ? e.preventDefault : " ";
      console.log("linkOnInteraction", e);

      // Fix for mobile IOS not opening link on click
      if (window.innerWidth < 800) {
        if (e.target.tagName === "A" && e.target.href !== "" && e.target.href !== "#") {
          window.open(e.target.href, "_self");
          return;
        }
      }

      var id = this.getAttribute("data-click-to");

      if (e.type === "mouseover" || e.type === "click") {
        id = this.getAttribute("data-hover-to");
      }

      if (id === "false") {
        clearPrimaryLink();
        clearActiveSidebar();
        return;
      }

      var targetedSlide = list[id];
      console.log("targetedSlide", targetedSlide);
      if (targetedSlide && !targetedSlide.isActive) {
        clearActiveLink();
        clearPrimaryLink();
        setActive(this);
        Sidebar.hide();
        targetedSlide.setActive();
      }
    };

    bindSidebarTriggers = function () {
      nodes.sidebar_triggers.forEach(function (trigger) {
        trigger.addEventListener("mouseover", sidebarTriggerOnHover);
      });
    };

    bindSidebarClosers = function () {
      nodes.sidebar_closers.forEach(function (closer) {
        closer.addEventListener("click", sidebarCloserOnClick);
      });
    };

    bindLinks = function () {
      nodes.links_click.forEach(function (link) {
        link.addEventListener("click", linkOnInteraction);
      });

      nodes.links_hover.forEach(function (link) {
        link.addEventListener("mouseover", linkOnInteraction);
      });
      if (window.innerWidth > 1023) {
      }

      nodes.links_hover.forEach(function (link) {
        link.addEventListener("click", linkOnInteraction);
      });
    };

    drawerOnClose = function () {
      list["mainmenu"].setActive();
      Sidebar.hide();
    };

    var onOverlayClose = function (e) {
      if (e.detail && e.detail.id === "nav_drawer") {
        drawerOnClose();
      }
    };

    var bindBodyListeners = function () {
      document.body.addEventListener("overlay:closed", onOverlayClose);
    };

    bind = function () {
      bindLinks();
      bindSidebarTriggers();
      bindSidebarClosers();
      bindBodyListeners();
    };

    createSlides = function () {
      nodes.slides.forEach(function (slide) {
        var id = slide.getAttribute("data-slide");
        list[id] = new Slide(id);
      });
    };

    init = function () {
      createSlides();
      bind();
    };

    init();

    return {
      init: init,
      list: list,
    };
  })();
}
