(function () {
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

})();