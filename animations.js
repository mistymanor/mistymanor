(function() {
    // Elements to animate when they enter the viewport
    const animatedElements = [
        'header',
        '.hero',
        '.main-content h1',
        '.main-content p',
        '.contact-info',
        '.buttons',
        'footer',
        // Add any other elements you want to animate
        '.about-section',
        '.services-section',
        '.testimonials',
        '.gallery-item',
        'section',
        'article',
        '.feature-box'
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
    
    // Helper function to determine if an element should be excluded
    function shouldExcludeElement(element) {
        return excludedElements.some(excludedSelector => 
            element.matches(excludedSelector) || element.querySelector(excludedSelector)
        );
    }
    
    // Set initial state for all elements (invisible)
    const elementsToAnimate = [];
    animatedElements.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            // Skip elements that match the excluded selectors
            if (!shouldExcludeElement(el)) {
                el.classList.add('animated-element');
                elementsToAnimate.push(el);
            }
        });
    });
    
    // Create intersection observer to detect when elements enter/exit the viewport
    const observerOptions = {
        root: null, // Use the viewport as the root
        rootMargin: '0px', // No margin around the root
        threshold: 0.15 // Trigger when 15% of the element is visible
    };
    
    // Define the intersection observer callback function
    const handleIntersection = (entries, observer) => {
        entries.forEach(entry => {
            // Add the fade-in class when the element enters the viewport
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            } else {
                // Remove the fade-in class when the element exits the viewport
                // This allows the animation to occur again when scrolled back into view
                entry.target.classList.remove('fade-in');
            }
        });
    };
    
    // Create the observer instance
    const observer = new IntersectionObserver(handleIntersection, observerOptions);
    
    // Special case - handle initial above-the-fold content differently
    // Elements already visible when the page loads should animate immediately
    const handleInitialVisibility = () => {
        // Get viewport height
        const viewportHeight = window.innerHeight;
        
        // Apply immediate animation to elements that are initially visible
        elementsToAnimate.forEach(element => {
            const rect = element.getBoundingClientRect();
            // If element is in the initial viewport, animate immediately
            if (rect.top < viewportHeight) {
                // Add a small delay for a nicer initial loading effect
                setTimeout(() => {
                    element.classList.add('fade-in');
                }, 100);
            }
            
            // Observe the element for future scroll interactions
            observer.observe(element);
        });
    };
    
    // Handle elements already in view on page load
    if (document.readyState === 'complete') {
        handleInitialVisibility();
    } else {
        window.addEventListener('load', handleInitialVisibility);
    }
    
    // Performance optimization: Disconnect observer when all animations have played once
    let allAnimated = false;
    
    // Optional: Add a scroll listener to check if we've scrolled to the bottom
    // This can help optimize by disconnecting the observer when no more animations are likely
    window.addEventListener('scroll', () => {
        if (allAnimated) return;
        
        // Check if we've scrolled to near the bottom of the page
        const scrollPosition = window.scrollY + window.innerHeight;
        const pageHeight = document.documentElement.scrollHeight;
        
        if (scrollPosition >= pageHeight - 200) {
            // We've reached the bottom, check if all elements have been animated
            const notAnimated = elementsToAnimate.filter(el => 
                !el.classList.contains('fade-in')
            );
            
            if (notAnimated.length === 0) {
                // All elements have been animated at least once
                allAnimated = true;
                // We can disconnect the observer to save resources
                // But since we want elements to re-animate when scrolling back up,
                // we'll keep it connected
            }
        }
    }, { passive: true }); // Use passive listener for performance
})();
