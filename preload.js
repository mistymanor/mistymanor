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
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src;
            s.onload = () => resolve(src + ' loaded');
            s.onerror = () => reject(new Error(src + ' failed to load'));
            document.body.appendChild(s);
        });
    }

    window.addEventListener('load', () => {
        console.log('Window fully loaded (including images). Waiting 1s before injecting scripts...');
        
        // Wait a second to ensure rendering is stable
        setTimeout(async () => {
          try {
            const anim = await loadScript('animations.js');
            console.log(anim);
            const main = await loadScript('script.js');
            console.log(main);
          } catch (err) {
            console.error('Script loading failed:', err);
          }
        }, 1000); // Adjust this delay if needed (in ms)
    });
});