document.addEventListener('DOMContentLoaded', function () {
    const animatedElements = [
      'header',
      '.hero',
      '.main-content h1',
      '.main-content p',
      '.contact-info',
      '.buttons',
      'footer',
    ];
  
    const excludedElements = [
      '.hamburger-menu',
      '.mobile-nav',
      '.mobile-menu',
      '.mobile-nav-container',
      '.mobile-nav-header',
      '.close-btn'
    ];
  
    // Initial fade-in animation with delay
    let delay = 0;
    const increment = 200;
  
    animatedElements.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (!shouldExcludeElement(el)) {
          el.classList.add('animated-element');
          setTimeout(() => {
            el.classList.add('fade-in');
          }, delay);
        }
      });
      delay += increment;
    });
  
    // Persistent scroll-based fade-in
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
        }
      });
    }, {
      threshold: 0.1
    });
  
    animatedElements.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (!shouldExcludeElement(el)) {
          observer.observe(el);
        }
      });
    });
  
    function shouldExcludeElement(element) {
      return excludedElements.some(excludedSelector =>
        element.matches(excludedSelector) || element.querySelector(excludedSelector)
      );
    }
  });
  