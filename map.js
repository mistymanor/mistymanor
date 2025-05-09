/**
 * Misty Manor Map & Directions JavaScript
 * This file handles the enhanced Google Maps functionality and directions for the contact page
 */

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
        styles: [
            {
                "featureType": "all",
                "elementType": "geometry.fill",
                "stylers": [{"weight": "2.00"}]
            },
            {
                "featureType": "landscape",
                "elementType": "all",
                "stylers": [{"color": "#f2f2f2"}]
            },
            {
                "featureType": "poi",
                "elementType": "all",
                "stylers": [{"visibility": "off"}]
            },
            {
                "featureType": "road",
                "elementType": "all",
                "stylers": [{"saturation": -100}, {"lightness": 45}]
            }
        ]
    };

    // Create the map instance
    map = new google.maps.Map(document.getElementById("map"), mapOptions);
    
    // Create a marker for Misty Manor using AdvancedMarkerElement
    const markerContent = document.createElement('div');
    markerContent.innerHTML = `
        <div class="map-marker" title="Misty Manor Equestrian Center">
            <img src="https://maps.google.com/mapfiles/ms/icons/red-dot.png" alt="Misty Manor">
        </div>
    `;
    
    destinationMarker = new google.maps.marker.AdvancedMarkerElement({
        position: MISTY_MANOR_COORDINATES,
        map: map,
        title: "Misty Manor Equestrian Center",
        content: markerContent
    });
    
    // Add info window for the destination marker
    const infoWindow = new google.maps.InfoWindow({
        content: `<div style="width:200px"><strong>Misty Manor Equestrian Center</strong><br>${MISTY_MANOR_ADDRESS}</div>`
    });
    
    destinationMarker.addListener("click", function() {
        infoWindow.open(map, destinationMarker);
    });
    
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
                calculateAndDisplayRoute(mode);
            }
        });
    });
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
                
                // Calculate and display the route
                calculateAndDisplayRoute('DRIVING'); // Default to driving
                
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
                
                // Only update if the position actually changed
                if (userLocation.lat !== newLocation.lat || userLocation.lng !== newLocation.lng) {
                    userLocation = newLocation;
                    updateUserMarker(userLocation);
                    
                    // Recalculate route with current transport mode
                    const activeMode = document.querySelector('.transport-mode.active');
                    calculateAndDisplayRoute(activeMode ? activeMode.getAttribute('data-mode') : 'DRIVING');
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
    
    userMarker = new google.maps.marker.AdvancedMarkerElement({
        position: location,
        map: map,
        title: "Your Location",
        content: userMarkerContent
    });
    
    // Fit map to include both markers
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(location);
    bounds.extend(MISTY_MANOR_COORDINATES);
    map.fitBounds(bounds);
    
    // Add info window for user marker
    const infoWindow = new google.maps.InfoWindow({
        content: "<div style='width:150px'><strong>Your Location</strong></div>"
    });
    
    userMarker.addListener("click", function() {
        infoWindow.open(map, userMarker);
    });
}

/**
 * Update the user marker position
 */
function updateUserMarker(location) {
    if (userMarker) {
        userMarker.setPosition(location);
    } else {
        addUserMarker(location);
    }
}

/**
 * Calculate and display the route between user location and Misty Manor
 */
function calculateAndDisplayRoute(travelMode) {
    if (!userLocation) return;
    
    const mode = google.maps.TravelMode[travelMode];
    
    // Set active mode button
    document.querySelectorAll('.transport-mode').forEach(btn => {
        if (btn.getAttribute('data-mode') === travelMode) {
            btn.classList.add('active');
        } else {
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
    // Show/hide transport options based on distance
    if (distanceInMiles > 500) {
        // Show all options for long distance
        document.getElementById('transport-driving').style.display = 'inline-block';
        document.getElementById('transport-transit').style.display = 'inline-block';
        document.getElementById('transport-walking').style.display = 'none';
        document.getElementById('transport-bicycling').style.display = 'none';
    } else if (distanceInMiles > 50) {
        // Medium distance
        document.getElementById('transport-driving').style.display = 'inline-block';
        document.getElementById('transport-transit').style.display = 'inline-block';
        document.getElementById('transport-walking').style.display = 'none';
        document.getElementById('transport-bicycling').style.display = 'none';
    } else if (distanceInMiles > 10) {
        // Shorter distance
        document.getElementById('transport-driving').style.display = 'inline-block';
        document.getElementById('transport-transit').style.display = 'inline-block';
        document.getElementById('transport-bicycling').style.display = 'inline-block';
        document.getElementById('transport-walking').style.display = 'none';
    } else {
        // Very short distance, show all options
        document.getElementById('transport-driving').style.display = 'inline-block';
        document.getElementById('transport-transit').style.display = 'inline-block';
        document.getElementById('transport-bicycling').style.display = 'inline-block';
        document.getElementById('transport-walking').style.display = distanceInMiles <= 5 ? 'inline-block' : 'none';
    }
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

// Handle cleanup when the page is unloaded
window.addEventListener('beforeunload', function() {
    // Clear any location watches
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
});
