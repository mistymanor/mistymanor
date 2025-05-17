/**
 * Misty Manor Map & Directions JavaScript
 * This file handles the enhanced Google Maps functionality and directions for the contact page
 */

// Load the Google Maps API using the recommended loader pattern
(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})
({key: "AIzaSyACz3vS-NSp_Zq2Z1IHzdt09SgS4XS4-l0", v: "weekly"});

// Initialize required libraries and call initMap when everything is loaded
async function initGoogleMaps() {
  try {
    // Load the required libraries first
    const { Map } = await google.maps.importLibrary("maps");
    const { Places } = await google.maps.importLibrary("places");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    
    // Now call the initMap function
    if (typeof initMap === 'function') {
      initMap();
    } else {
      console.error("initMap function not found.");
    }
  } catch (error) {
    console.error("Error loading Google Maps:", error);
    handleMapLoadError();
  }
}

// Start loading when the document is ready
if (document.readyState !== 'loading') {
  initGoogleMaps();
} else {
  document.addEventListener('DOMContentLoaded', initGoogleMaps);
}

// Configuration
const MISTY_MANOR_ADDRESS = "7621 Ridge Rd, Marriottsville, MD 21104";
const MISTY_MANOR_COORDINATES = { lat: 39.364420, lng: -76.896384 };
const DEFAULT_ZOOM = 13;

// Global variables
let map;
let userMarker;
let destinationMarker;
let directionsService;
let directionsRenderer;
let userLocation;
let watchId;
let lastDistance;
let directionsManuallyHidden = false; // Flag to track if directions were explicitly hidden by user
let lastLocationUpdate = 0; // Timestamp for throttling location updates

/**
 * Initialize the map when the page loads
 */
function initMap() {
    // Define map options now that Google API is loaded
    const mapOptions = {
        zoom: DEFAULT_ZOOM,
        center: MISTY_MANOR_COORDINATES,
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
        },
        scaleControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        mapId: "8812820e70aa14f0" // Add a valid Map ID for Advanced Markers
        // Note: When using mapId, styles should be configured in the Google Cloud Console
        // instead of being set directly in the code
    };

    // Create the map instance
    map = new google.maps.Map(document.getElementById("map"), mapOptions);
    
    // Ensure map is properly sized for mobile devices
    ensureMapIsVisible();
    
    // Create a marker for Misty Manor using createMarker helper function
    const markerContent = document.createElement('div');
    markerContent.innerHTML = `
        <div class="map-marker" title="Misty Manor Equestrian Center">
            <img src="https://maps.google.com/mapfiles/ms/icons/red-dot.png" alt="Misty Manor">
        </div>
    `;
    
    destinationMarker = createMarker({
        position: MISTY_MANOR_COORDINATES,
        map: map,
        title: "Misty Manor Equestrian Center",
        content: markerContent,
        icon: "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
    });
    
    // Add info window for the destination marker
    const infoWindow = new google.maps.InfoWindow({
        content: `<div style="width:200px; color: #000000 !important; font-family: 'Poppins', sans-serif !important;"><strong style="color: #000000 !important;">Misty Manor Equestrian Center</strong><br><span style="color: #000000 !important;">${MISTY_MANOR_ADDRESS}</span></div>`
    });
    
    // Use 'gmp-click' for AdvancedMarkerElements
    if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
        destinationMarker.addListener("gmp-click", function() {
            infoWindow.open(map, destinationMarker);
        });
    } else {
        // Fallback to 'click' for regular markers
        destinationMarker.addListener("click", function() {
            infoWindow.open(map, destinationMarker);
        });
    }
    
    // Initialize directions services
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true, // We'll use our own markers
        polylineOptions: {
            strokeColor: "#3a5f8f", // Misty Manor blue
            strokeWeight: 5,
            strokeOpacity: 0.7
        }
    });
    
    // Explicitly make sure no styles property is set after initialization
    if (directionsRenderer.setOptions) {
        directionsRenderer.setOptions({
            styles: null,
            mapTypeId: null
        });
    }
    
    // Add directions panel
    directionsRenderer.setPanel(document.getElementById("directions-panel"));
    
    // Try to get the user's location
    getUserLocation();
    
    // Set up event listeners for transportation mode switches
    document.querySelectorAll('.transport-mode').forEach(button => {
        button.addEventListener('click', function() {
            const mode = this.getAttribute('data-mode');
            document.querySelectorAll('.transport-mode').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            if (userLocation) {
                calculateAndDisplayRoute(mode, true);
            }
        });
    });
    
    // Add event listener for the "Get Route Info" button
    const showDirectionsBtn = document.getElementById('show-directions');
    if (showDirectionsBtn) {
        showDirectionsBtn.addEventListener('click', function() {
            // Toggle the visibility of the directions
            const container = document.querySelector('.contact-container').parentNode;
            
            if (container.classList.contains('directions-visible')) {
                // Hide directions
                container.classList.remove('directions-visible');
                this.textContent = "Get Route Info";
                // Set flag that directions were manually hidden
                directionsManuallyHidden = true;
                
                // Add the icon back
                this.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21.71 11.29l-9-9a.996.996 0 00-1.41 0l-9 9a.996.996 0 000 1.41l9 9c.39.39 1.02.39 1.41 0l9-9a.996.996 0 000-1.41zM14 14.5V12h-4v3H8v-4c0-.55.45-1 1-1h5V7.5l3.5 3.5-3.5 3.5z"/>
                    </svg>
                    Get Route Info
                `;
                
                // Hide transport buttons when directions are hidden
                document.querySelectorAll('.transport-mode-btn').forEach(btn => {
                    btn.style.display = 'none'; // Ensure they're hidden
                });
            } else {
                // Show directions
                container.classList.add('directions-visible');
                // Reset flag since directions are now being shown explicitly
                directionsManuallyHidden = false;
                
                this.textContent = "Hide Route Info";
                // Add the icon but with hide icon
                this.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                    Hide Route Info
                `;
                
                // Show appropriate transport buttons when directions are shown
                updateTransportVisibility();
                
                // Make sure route information is calculated and up-to-date
                const activeMode = document.querySelector('.transport-mode.active:not(#show-directions)');
                if (activeMode) {
                    calculateAndDisplayRoute(activeMode.getAttribute('data-mode'), true);
                } else {
                    calculateAndDisplayRoute('DRIVING', true);
                }
            }
        });
    }
}

/**
 * Get the user's current location
 */
function getUserLocation() {
    // Check if geolocation is available
    if (navigator.geolocation) {
        // Show loading indicator
        document.getElementById('location-status').textContent = "Locating you...";
        
        // Get current position once
        navigator.geolocation.getCurrentPosition(
            // Success callback
            position => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Update location status
                document.getElementById('location-status').textContent = "Location found!";
                setTimeout(() => {
                    document.getElementById('location-status').textContent = "";
                }, 3000);
                
                // Add marker for user's location
                addUserMarker(userLocation);
                
                // Show ONLY the Get Route Info button and ensure transport buttons remain hidden
                const showDirectionsBtn = document.getElementById('show-directions');
                if (showDirectionsBtn) {
                    showDirectionsBtn.style.display = 'inline-block';
                }
                
                // Explicitly ensure transport mode buttons remain hidden until the Get Route Info button is clicked
                document.querySelectorAll('.transport-mode-btn').forEach(btn => {
                    btn.style.display = 'none'; // Override any other styling
                });
                
                // Calculate and display the route but don't show it yet
                calculateAndDisplayRoute('DRIVING', false); // Default to driving
                
                // Start watching for position changes
                startLocationTracking();
            },
            // Error callback
            error => {
                handleLocationError(error);
            },
            // Options
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    } else {
        // Browser doesn't support Geolocation
        handleLocationError({ code: 0, message: "Geolocation not supported by this browser." });
    }
}

/**
 * Start tracking the user's location
 */
function startLocationTracking() {
    if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
            // Success callback
            position => {
                const newLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Implement throttling - only update max once per 3 seconds
                const now = Date.now();
                if (now - lastLocationUpdate < 3000) {
                    return; // Skip this update if it's too soon
                }
                
                // Only update if the position actually changed
                if (userLocation.lat !== newLocation.lat || userLocation.lng !== newLocation.lng) {
                    userLocation = newLocation;
                    updateUserMarker(userLocation);
                    lastLocationUpdate = now;
                    
                    // If directions were manually hidden by the user, don't show them again automatically
                    if (directionsManuallyHidden) {
                        // Calculate route in the background without showing it
                        const activeMode = document.querySelector('.transport-mode.active');
                        const travelMode = activeMode ? activeMode.getAttribute('data-mode') : 'DRIVING';
                        calculateAndDisplayRoute(travelMode, false);
                        return;
                    }
                    
                    // Otherwise, respect the current visibility state
                    const container = document.querySelector('.contact-container').parentNode;
                    const isDirectionsVisible = container.classList.contains('directions-visible');
                    
                    // Get the active transportation mode
                    const activeMode = document.querySelector('.transport-mode.active');
                    const travelMode = activeMode ? activeMode.getAttribute('data-mode') : 'DRIVING';
                    
                    // Only show directions if they were already visible
                    calculateAndDisplayRoute(travelMode, isDirectionsVisible);
                }
            },
            // Error callback
            error => {
                console.warn("Error in location tracking:", error.message);
                // Don't show error to user for tracking issues, just stop tracking
                if (watchId) {
                    navigator.geolocation.clearWatch(watchId);
                    watchId = null;
                }
            },
            // Options
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 5000
            }
        );
    }
}

/**
 * Add marker for user's location
 */
function addUserMarker(location) {
    // Create user marker with AdvancedMarkerElement
    const userMarkerContent = document.createElement('div');
    userMarkerContent.innerHTML = `
        <div class="map-marker" title="Your Location">
            <img src="https://maps.google.com/mapfiles/ms/icons/blue-dot.png" alt="Your Location">
        </div>
    `;
    
    userMarker = createMarker({
        position: location,
        map: map,
        title: "Your Location",
        content: userMarkerContent,
        icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
    });
    
    // Fit map to include both markers
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(location);
    bounds.extend(MISTY_MANOR_COORDINATES);
    map.fitBounds(bounds);
    
    // Add info window for user marker
    const infoWindow = new google.maps.InfoWindow({
        content: "<div style='width:150px; color: #000000 !important; font-family: \"Poppins\", sans-serif !important;'><strong style='color: #000000 !important;'>Your Location</strong></div>"
    });
    
    // Use 'gmp-click' for AdvancedMarkerElements
    if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
        userMarker.addListener("gmp-click", function() {
            infoWindow.open(map, userMarker);
        });
    } else {
        // Fallback to 'click' for regular markers
        userMarker.addListener("click", function() {
            infoWindow.open(map, userMarker);
        });
    }
}

/**
 * Helper function to set a marker's position that works with both marker types
 */
function setMarkerPosition(marker, position) {
    if (!marker) return;
    
    // For AdvancedMarkerElement
    if (marker.position !== undefined) {
        // Create a new marker with the updated position
        const newContent = marker.content;
        const newTitle = marker.title;
        const map = marker.map;
        
        // Remove the old marker first to prevent duplicates
        marker.map = null;
        
        // Return a new marker with the updated position
        return createMarker({
            position: position,
            map: map,
            title: newTitle,
            content: newContent
        });
    }
    
    // For regular Marker
    if (typeof marker.setPosition === 'function') {
        marker.setPosition(position);
        return marker;
    }
    
    return null;
}

/**
 * Update the user marker position
 */
function updateUserMarker(location) {
    if (userMarker) {
        // Use our helper function to update the marker position
        const updatedMarker = setMarkerPosition(userMarker, location);
        if (updatedMarker) {
            userMarker = updatedMarker;
        } else {
            // If marker update failed, create a new one
            addUserMarker(location);
        }
    } else {
        addUserMarker(location);
    }
}

/**
 * Calculate and display the route between user location and Misty Manor
 * @param {string} travelMode - The travel mode (DRIVING, WALKING, BICYCLING)
 * @param {boolean} showDirections - Whether to immediately display the directions (default: true)
 */
function calculateAndDisplayRoute(travelMode, showDirections = true) {
    if (!userLocation) return;
    
    // Validate travel mode to prevent undefined errors
    if (!travelMode || !google.maps.TravelMode[travelMode]) {
        travelMode = 'DRIVING'; // Default to DRIVING if invalid mode
    }
    
    const mode = google.maps.TravelMode[travelMode];
    
    // Set active mode button
    document.querySelectorAll('.transport-mode').forEach(btn => {
        if (btn.getAttribute('data-mode') === travelMode) {
            btn.classList.add('active');
        } else if (btn.id !== 'show-directions') {
            btn.classList.remove('active');
        }
    });
    
    directionsService.route(
        {
            origin: userLocation,
            destination: MISTY_MANOR_COORDINATES,
            travelMode: mode,
            provideRouteAlternatives: true,
            unitSystem: google.maps.UnitSystem.IMPERIAL
        },
        (response, status) => {
            if (status === "OK") {
                // Display the route on the map
                directionsRenderer.setDirections(response);
                
                // Get route info
                const route = response.routes[0];
                const leg = route.legs[0];
                
                // Calculate distance in miles
                const distanceInMiles = leg.distance.value / 1609.34;
                lastDistance = distanceInMiles;
                
                // Display travel time and distance
                document.getElementById("route-details").innerHTML = `
                    <div class="route-summary">
                        <p><strong>Distance:</strong> ${leg.distance.text}</p>
                        <p><strong>Estimated travel time:</strong> ${leg.duration.text}</p>
                    </div>
                `;
                
                // Show detailed directions if showDirections is true
                // Only show directions if explicitly requested AND not manually hidden
                if (showDirections && !directionsManuallyHidden) {
                    // Add the directions-visible class to show the route info and directions panel
                    const container = document.querySelector('.contact-container').parentNode;
                    if (!container.classList.contains('directions-visible')) {
                        container.classList.add('directions-visible');
                        
                        // Make transport buttons visible if directions are shown
                        updateTransportVisibility();
                    }
                } else {
                    // If not showing directions or they were manually hidden, ensure they stay hidden
                    if (directionsManuallyHidden) {
                        const container = document.querySelector('.contact-container').parentNode;
                        container.classList.remove('directions-visible');
                    }
                    
                    // Ensure transport buttons remain hidden
                    document.querySelectorAll('.transport-mode-btn').forEach(btn => {
                        btn.style.display = 'none';
                    });
                }
                
                // Show general travel recommendations based on distance
                updateGeneralDirections(distanceInMiles);
                
                // Show appropriate transport options based on distance
                updateTransportOptions(distanceInMiles);
            } else {
                console.error("Directions request failed due to " + status);
                document.getElementById("directions-panel").innerHTML = 
                    `<p class="error">Sorry, we couldn't calculate directions. ${status}</p>`;
            }
        }
    );
}

/**
 * Update the general directions guidance based on distance
 */
function updateGeneralDirections(distanceInMiles) {
    const generalDirectionsEl = document.getElementById('general-directions');
    
    if (distanceInMiles > 500) {
        // Long distance - recommend flight
        generalDirectionsEl.innerHTML = `
            <h3>Getting to Misty Manor</h3>
            <p>You are approximately ${Math.round(distanceInMiles)} miles away from Misty Manor.</p>
            <p><strong>Recommended travel method:</strong> Flight to Baltimore/Washington International Airport (BWI), then rent a car or use a ride service to reach us (approximately 25 miles from BWI).</p>
            <p><strong>Alternative airports:</strong> Reagan National (DCA) or Dulles (IAD) are both within 50 miles of our location.</p>
        `;
    } else if (distanceInMiles > 100) {
        // Medium distance - recommend driving with hotel
        generalDirectionsEl.innerHTML = `
            <h3>Getting to Misty Manor</h3>
            <p>You are approximately ${Math.round(distanceInMiles)} miles away from Misty Manor.</p>
            <p><strong>Recommended travel method:</strong> Drive to our location (about ${Math.round(distanceInMiles/60)} hours at highway speeds).</p>
            <p>Consider booking accommodations nearby if you plan to stay. Several hotels are available in Columbia and Ellicott City, both within 15 minutes of our location.</p>
        `;
    } else if (distanceInMiles > 30) {
        // Near distance - simple driving directions
        generalDirectionsEl.innerHTML = `
            <h3>Getting to Misty Manor</h3>
            <p>You are approximately ${Math.round(distanceInMiles)} miles away from Misty Manor.</p>
            <p><strong>Recommended travel method:</strong> Drive directly to our location (about ${Math.round(distanceInMiles/30)} minutes).</p>
            <p>We have ample parking available for visitors.</p>
        `;
    } else {
        // Local distance - very simple directions
        generalDirectionsEl.innerHTML = `
            <h3>Getting to Misty Manor</h3>
            <p>You are only ${Math.round(distanceInMiles)} miles away from Misty Manor!</p>
            <p>Follow the turn-by-turn directions below to reach us. We have parking available on-site.</p>
        `;
    }
}

/**
 * Update transport options based on distance
 */
function updateTransportOptions(distanceInMiles) {
    // First reset all transport modes by removing any distance-based hiding
    document.getElementById('transport-driving').classList.remove('hidden-option');
    document.getElementById('transport-walking').classList.remove('hidden-option');
    document.getElementById('transport-bicycling').classList.remove('hidden-option');

    // Show/hide transport options based on distance
    if (distanceInMiles > 500) {
        // Show only driving for long distance
        document.getElementById('transport-walking').classList.add('hidden-option');
        document.getElementById('transport-bicycling').classList.add('hidden-option');
    } else if (distanceInMiles > 50) {
        // Medium distance
        document.getElementById('transport-walking').classList.add('hidden-option');
        document.getElementById('transport-bicycling').classList.add('hidden-option');
    } else if (distanceInMiles > 10) {
        // Shorter distance
        document.getElementById('transport-walking').classList.add('hidden-option');
    } else {
        // Very short distance, show all applicable options
        if (distanceInMiles > 5) {
            document.getElementById('transport-walking').classList.add('hidden-option');
        }
    }
    
    // Update the visibility of transport buttons
    updateTransportVisibility();
}

/**
 * Update transport mode buttons visibility based on active directions and distance
 */
function updateTransportVisibility() {
    const container = document.querySelector('.contact-container').parentNode;
    const isDirectionsVisible = container.classList.contains('directions-visible');
    
    // Get all transport mode buttons
    const transportButtons = document.querySelectorAll('.transport-mode-btn');
    
    // Set initial visibility based on directions panel visibility
    transportButtons.forEach(btn => {
        if (isDirectionsVisible && !btn.classList.contains('hidden-option')) {
            btn.style.display = 'inline-block';
        } else {
            btn.style.display = 'none';
        }
    });
    
    // Note: The visibility logic works as follows:
    // 1. All transport buttons are hidden by default (.transport-mode-btn or style="display: none")
    // 2. When directions are visible AND the button is not hidden by distance (.hidden-option), 
    //    then the button is shown with display: inline-block
}

/**
 * Handle location errors
 */
function handleLocationError(error) {
    const locationStatus = document.getElementById('location-status');
    const directionsWidget = document.getElementById('directions-widget');
    
    // Update status message based on error
    switch(error.code) {
        case 1: // PERMISSION_DENIED
            locationStatus.textContent = "Location permission denied. Please enable location services to see directions.";
            break;
        case 2: // POSITION_UNAVAILABLE
            locationStatus.textContent = "Your location is currently unavailable. Please try again later.";
            break;
        case 3: // TIMEOUT
            locationStatus.textContent = "Timed out getting your location. Please try again.";
            break;
        default:
            locationStatus.textContent = "Unable to get your location: " + error.message;
    }
    
    // Still show the map centered on Misty Manor
    map.setCenter(MISTY_MANOR_COORDINATES);
    map.setZoom(13);
    
    // Show fallback directions info
    document.getElementById('general-directions').innerHTML = `
        <h3>Finding Your Way to Misty Manor</h3>
        <p>Misty Manor Riding School is located at 7621 Ridge Road, Marriottsville, MD 21104, nestled in the scenic countryside just outside of Baltimore.</p>
        <p>From I-70:</p>
        <ul>
            <li>Take I-70 West towards Frederick</li>
            <li>Take exit 83 onto Marriotsville Rd</li>
            <li>Keep right for Marriotsville Rd N, then, in 3.7 miles, turn left onto Ridge Rd</li>
            <li>After about a mile, turn right still on Ridge Road</li>
            <li>Misty Manor will be on your left after 0.3 miles!</li>
        </ul>
    `;
    
    // Hide the route details section
    document.getElementById('route-details').innerHTML = 
        '<p>Enable location services to see personalized directions.</p>';
}

// The DOMContentLoaded event listener is removed because the Google Maps API will call initMap directly
// when it finishes loading via the callback parameter
/**
 * Helper function to create a marker, using AdvancedMarkerElement if available,
 * or falling back to a regular Marker if not
 */
function createMarker(options) {
    // Check if AdvancedMarkerElement is available
    if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
        // Use AdvancedMarkerElement
        return new google.maps.marker.AdvancedMarkerElement({
            position: options.position,
            map: options.map,
            title: options.title,
            content: options.content
            // Note: Don't pass mapId to the marker itself, it inherits from the map
        });
    } else {
        // Fall back to regular Marker
        const marker = new google.maps.Marker({
            position: options.position,
            map: options.map,
            title: options.title,
            icon: options.icon
        });

        // Add setPosition method to match AdvancedMarkerElement API
        marker.setPosition = function(position) {
            google.maps.Marker.prototype.setPosition.call(this, position);
        };

        return marker;
    }
}

// Handle map loading errors
function handleMapLoadError() {
    console.error("Google Maps API did not load properly");
    document.getElementById('map').innerHTML = 
        '<div style="text-align:center;padding:50px;"><p>Map could not be loaded. Please refresh the page or try again later.</p></div>';
}

// Set a timeout to check if the map loaded
setTimeout(function() {
    if (typeof google === 'undefined') {
        handleMapLoadError();
    }
}, 10000); // Check after 10 seconds

/**
 * Helper function to get position from either AdvancedMarkerElement or regular Marker
 */
function getMarkerPosition(marker) {
    if (!marker) return null;
    
    // Check if it's an AdvancedMarkerElement (has position property)
    if (marker.position) {
        return marker.position;
    }
    
    // Check if it's a regular Marker (has getPosition method)
    if (typeof marker.getPosition === 'function') {
        return marker.getPosition();
    }
    
    // Fallback to null if we can't determine position
    return null;
}

/**
 * Ensure the map is visible and properly sized, especially on mobile devices
 */
function ensureMapIsVisible() {
    if (!map) return;
    
    // Force the map to be visible
    const mapElement = document.getElementById('map');
    if (mapElement) {
        // Ensure the map container has explicit dimensions
        mapElement.style.width = '100%';
        mapElement.style.height = '350px'; // Explicit height for mobile
        mapElement.style.display = 'block';
        
        // Trigger a resize event on the map
        google.maps.event.trigger(map, 'resize');
        
        // Re-center the map
        if (userMarker && destinationMarker) {
            const bounds = new google.maps.LatLngBounds();
            
            // Get positions using the helper function that works with both marker types
            const userPos = getMarkerPosition(userMarker);
            const destPos = getMarkerPosition(destinationMarker);
            
            if (userPos) bounds.extend(userPos);
            if (destPos) bounds.extend(destPos);
            
            if (bounds.isEmpty()) {
                map.setCenter(MISTY_MANOR_COORDINATES);
            } else {
                map.fitBounds(bounds);
            }
        } else {
            map.setCenter(MISTY_MANOR_COORDINATES);
        }
    }
}

// Add event listener for window resize
window.addEventListener('resize', function() {
    // Use a debounce mechanism to avoid excessive calls
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(function() {
        ensureMapIsVisible();
    }, 200);
});

// Listen for orientation change events
window.addEventListener('orientationchange', function() {
    setTimeout(ensureMapIsVisible, 300); // Slight delay to let the browser complete the rotation
});

// Add helper function to handle menu toggling effects on the map
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger-menu');
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            // When mobile menu is toggled, resize map after animation completes
            setTimeout(ensureMapIsVisible, 400);
        });
    }
    
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            // When mobile menu is closed, resize map after animation completes
            setTimeout(ensureMapIsVisible, 400);
        });
    }
});

// Handle cleanup when the page is unloaded
window.addEventListener('beforeunload', function() {
    // Clear any location watches
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
});
