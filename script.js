document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded");
    // Directly select the mobile menu elements
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const closeBtn = document.querySelector('.close-btn');
    const mobileNav = document.querySelector('.mobile-nav');
    const mobileMenu = document.querySelector('.mobile-menu');
    const submenuToggle = document.querySelector('.submenu-toggle');
    const backBtn = document.querySelector('.back-btn');
    const dropdownToggle = document.querySelector('.dropdown-toggle');

    console.log("Hamburger menu element:", hamburgerMenu);
    console.log("Mobile nav element:", mobileNav);

    // Simple hamburger menu click handler
    if (hamburgerMenu && mobileNav) {
        hamburgerMenu.addEventListener('click', function(e) {
            console.log("Hamburger menu clicked");
            e.preventDefault();
            e.stopPropagation();
            
            // Toggle the active class on mobile-nav
            mobileNav.classList.add('active');
            console.log("Added active class to mobile-nav");
            
            // Prevent scrolling when menu is open
            document.body.style.overflow = 'hidden';
        });
    }

    // Close button functionality
    if (closeBtn && mobileNav) {
        closeBtn.addEventListener('click', function() {
            mobileNav.classList.remove('active');
            if (mobileMenu) {
                mobileMenu.classList.remove('show-submenu');
            }
            document.body.style.overflow = ''; // Re-enable scrolling
        });
    }

    // Submenu toggle functionality
    if (submenuToggle && mobileMenu) {
        submenuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            mobileMenu.classList.add('show-submenu');
        });
    }

    // Back button functionality
    if (backBtn && mobileMenu) {
        backBtn.addEventListener('click', function(e) {
            e.preventDefault();
            mobileMenu.classList.remove('show-submenu');
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (mobileNav && mobileNav.classList.contains('active') && 
            !e.target.closest('.mobile-menu') && 
            !e.target.closest('.hamburger-menu') &&
            !e.target.closest('.mobile-nav-header')) {
            mobileNav.classList.remove('active');
            if (mobileMenu) {
                mobileMenu.classList.remove('show-submenu');
            }
            document.body.style.overflow = '';
        }
    });

    // Close menu with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mobileNav && mobileNav.classList.contains('active')) {
            mobileNav.classList.remove('active');
            if (mobileMenu) {
                mobileMenu.classList.remove('show-submenu');
            }
            document.body.style.overflow = '';
        }
    });

    // Desktop dropdown functionality
    if (dropdownToggle && 'ontouchstart' in window) {
        dropdownToggle.addEventListener('click', function(e) {
            e.preventDefault();
            this.parentElement.classList.toggle('show-dropdown');
            
            // Close dropdown when clicking elsewhere
            document.addEventListener('click', function closeDropdown(event) {
                if (!event.target.closest('.dropdown')) {
                    const dropdown = document.querySelector('.dropdown');
                    if (dropdown) {
                        dropdown.classList.remove('show-dropdown');
                    }
                    document.removeEventListener('click', closeDropdown);
                }
            });
        });
    }

    // Handle window resize
    window.addEventListener('resize', function() {
        // Close mobile menu on larger screens
        if (window.innerWidth > 768 && mobileNav && mobileNav.classList.contains('active')) {
            mobileNav.classList.remove('active');
            if (mobileMenu) {
                mobileMenu.classList.remove('show-submenu');
            }
            document.body.style.overflow = '';
        }
    });

    // Newsletter form submission
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('newsletter-email').value;
            const newsletterMessage = document.getElementById('newsletter-message');
            
            // Here you would typically send the email to a server
            // For now, we'll just simulate a successful signup
            
            // Simulate processing
            newsletterMessage.textContent = "Processing...";
            newsletterMessage.style.color = "#333";
            
            // Simulate API call with timeout
            setTimeout(function() {
                // Success case
                newsletterMessage.textContent = "Thank you for subscribing!";
                newsletterMessage.style.color = "#3a5f8f";
                
                // Clear the form
                document.getElementById('newsletter-email').value = "";
                
                // Clear the success message after 5 seconds
                setTimeout(function() {
                    newsletterMessage.textContent = "";
                }, 5000);
                
            }, 1500);
        });
    }
});

// Trail Rides Booking System
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the trail-rides page
    const openBookingBtn = document.getElementById('open-booking');
    if (!openBookingBtn) return;

    const passwordPrompt = document.getElementById('booking-password-prompt');
    const confirmBtn = document.getElementById('confirm-password');
    const paymentContainer = document.getElementById('payment-container');
    const paymentProcessing = document.getElementById('payment-processing');
    const bookingContainer = document.getElementById('booking-widget-container');
    const processPaymentBtn = document.getElementById('process-payment');
    
    // Step 1: Open booking password prompt
    openBookingBtn.addEventListener('click', () => {
        passwordPrompt.style.display = 'block';
    });
    
    // Step 2: Verify password and show payment
    confirmBtn.addEventListener('click', () => {
        const password = document.getElementById('booking-password').value;
        if (btoa(password) === 'bWlzdHlwYXNz') { // "mistypass" in base64
            passwordPrompt.style.display = 'none';
            paymentContainer.style.display = 'block';
        } else {
            alert('Incorrect password! Please try again.');
        }
    });
    
    // Step 3: Process payment and show booking calendar
    processPaymentBtn.addEventListener('click', () => {
        // Basic form validation
        const cardNumber = document.getElementById('card-number').value;
        const expiryDate = document.getElementById('expiry-date').value;
        const cvv = document.getElementById('cvv').value;
        
        if (cardNumber === '' || expiryDate === '' || cvv === '') {
            alert('Please fill out all payment fields');
            return;
        }
        
        // Hide payment form and show processing
        paymentContainer.style.display = 'none';
        paymentProcessing.style.display = 'block';
        
        // Simulate payment processing
        setTimeout(() => {
            // Hide processing and show booking widget
            paymentProcessing.style.display = 'none';
            bookingContainer.style.display = 'block';
        }, 2000);
    });
    
    // Handle Stripe payment success return
    // This would need to be implemented with actual Stripe integration
    // For now, we'll just check for a success parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
        passwordPrompt.style.display = 'none';
        paymentContainer.style.display = 'none';
        bookingContainer.style.display = 'block';
    }
});
