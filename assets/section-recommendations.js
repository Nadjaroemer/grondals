if (typeof WDN.ProductRecommendations === 'undefined') {
  WDN.ProductRecommendations = (function() {
    
    var base_route = WDN.Routes.product_recommendations_url;
    
    var default_settings = {
      section_name: 'product-recommendations',
      amount_to_get: 6
    }
    
    var notify_root = function(name, contents) {
      var e = new CustomEvent('recommendations:update', { detail: {
        id: 'cart-recommendations',
        content: contents
      }});

      document.body.dispatchEvent(e);
    }

    var Recommendations = function(config) {
      this.id = false; // applied later when called
      this.section_id = config.id;
      this.amount = config.amount || default_settings.amount;
      this.section_name = config.section_name || default_settings.section_name;
      
      if (config.target) {
        this.output_selector = config.target;
        this.output_target = document.querySelectorAll(config.target);
      }
      
      this.recommendations = false;
    }
    
    Recommendations.prototype.onProductsUpdate = function() {};
    
    Recommendations.prototype.onLoad = function(res) {
      this.updateRecommendations(res);
      notify_root(this.section_id, res);
      this.onProductsUpdate();
    };
    
    Recommendations.prototype.updateRecommendations = function(res) {
      
      if (this.output_target) {
        const html = document.createElement('div');
        html.innerHTML = res;
        res = html.querySelector(this.output_selector).innerHTML;
        
        this.output_target.forEach(function(elem) {
          elem.innerHTML = res;
        })
      }
      
      this.recommendations = res;
    }
    
    Recommendations.prototype.load = function(id) {
      if (id) {
        this.id = id;
      }

      if (!this.id) {
        console.warn("Can not provide recommendations without product ID");
        return; 
      }
      
      var endpointForSection = [
        base_route + '?section_id='
        + this.section_name
        +'&product_id=' + this.id + '&limit='
        + this.amount].join('');

      var params = {
        url: endpointForSection,
      };

      params.onSuccess = this.onLoad.bind(this);
      
      WDN.Request.Get(params);
      
    }
    return Recommendations;
  })();
}