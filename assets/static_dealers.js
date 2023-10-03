(function() {

  var dealer_page = document.querySelector('.page__dealers');
  
  var error_container = document.querySelector('[data-zip-error]');
  var dealers = document.querySelectorAll('[data-dealer-item]');
  var search_form = document.querySelector('[data-zip-search-form]');
  var search_input = search_form.querySelector("input")

  var hide_elem = function(elem) {
    elem.style.display = 'none';
  }

  var show_elem = function(elem) {
    elem.removeAttribute('style');
  }

  var show_all = function(elem_list) {
    elem_list.forEach(function(elem) {
      show_elem(elem);
    });
  }

  function findByZip(zip) {
    var returnMessage ="";
    var first_letter_of_zip = zip.slice(0,1);

    if (zip != '' ) {
      var anyMatch = false;

      dealers.forEach(function(elem) {
        var attributeValue = elem.getAttribute('data-dealer-item');
        if(attributeValue !== "online"){
          var first_letter = attributeValue.slice(0,1);

          if(first_letter == first_letter_of_zip) {
            show_elem(elem);
            anyMatch = true;
          } else {
            hide_elem(elem);
          }
        }
      });

      dealer_page.setAttribute('data-zipsearch','error');

      if (anyMatch) {
        dealer_page.setAttribute('data-zipsearch','success');
      }

    } else {
      show_all(dealers);
    }
  }


  var onZipSearch = function() {
    var form_data = new FormData(search_form);
    var query = form_data.get('query');

    findByZip(query);

    AOS ? AOS.refresh() : false
  }

  search_form.addEventListener('submit', function(e) {
    e.preventDefault();
    onZipSearch();
  });

  var inputOnKeyDown = function(){
    var debouncedFunc = WDN.Debounce(onZipSearch, 200);
    debouncedFunc();
  }


  search_input.addEventListener("keydown", inputOnKeyDown)

})();