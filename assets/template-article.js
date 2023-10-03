/* Print button logic */
(function () {
  var init, bind, triggerOnClick;

  var triggers = document.querySelectorAll("[data-print-trigger]");

  triggerOnClick = function (e) {
    e ? e.preventDefault() : "";
    window.print();
  };

  bind = function () {
    triggers.forEach(function (trigger) {
      trigger.addEventListener("click", triggerOnClick);
    });
  };

  init = function () {
    bind();
  };

  init();
})();
