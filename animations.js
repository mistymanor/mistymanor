document.addEventListener('DOMContentLoaded', function() {
    // Elements to animate in sequence
    const animatedElements = [
        'header',
        '.hero',
        '.main-content h1',
        '.main-content p',
        '.contact-info',
        '.buttons',
        'footer'
    ];
    
    // Elements to exclude from animations
    const excludedElements = [
        '.hamburger-menu',
        '.mobile-nav',
        '.mobile-menu',
        '.mobile-nav-container',
        '.mobile-nav-header',
        '.close-btn'
    ];
    
    // Set initial state for all elements (invisible)
    animatedElements.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            // Skip elements that match the excluded selectors
            if (!shouldExcludeElement(el)) {
                el.classList.add('animated-element');
            }
        });
    });
    
    // Helper function to determine if an element should be excluded
    function shouldExcludeElement(element) {
        return excludedElements.some(excludedSelector => 
            element.matches(excludedSelector) || element.querySelector(excludedSelector)
        );
    }
    
    // Animate elements with a delay
    let delay = 0;
    const increment = 150; // milliseconds between animations
    
    animatedElements.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            // Skip elements that match the excluded selectors
            if (!shouldExcludeElement(el)) {
                setTimeout(() => {
                    el.classList.add('fade-in');
                }, delay);
            }
        });
        delay += increment;
    });
});

