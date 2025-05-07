document.addEventListener('DOMContentLoaded', function() {
    const images = Array.from(document.images);
    const total = images.length;
    let loaded = 0;

    if (total === 0) {
        revealPage();
        return;
    }

    images.forEach((img) => {
        if (img.complete) {
            checkDone();
        }
        else {
            img.addEventListener('load', checkDone);
            img.addEventListener('error', checkDone); // in case an image fails to load
        }
    });

    function checkDone() {
        loaded++;
        if (loaded === total) {
            revealPage();
        }
    }

    function revealPage() {
        document.body.style.visibility = 'visible';
        loadScript('/script.js');
        loadScript('/animations.js');
    }

    function loadScript(src) {
        const s = document.createElement('script');
        s.src = src;
        s.defer = true;
        document.body.appendChild(s);
        s.onload = function() {
            console.log(`Script loaded: ${src}`);
        };
        s.onerror = function() {
            console.error(`Error loading script: ${src}`);
        };
    }
});