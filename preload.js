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
        } else {
            img.addEventListener('load', checkDone);
            img.addEventListener('error', checkDone);
        }
    });

    function checkDone() {
        loaded++;
        if (loaded === total) {
            // Wait slightly to ensure rendering pipeline is done
            setTimeout(revealPage, 300);
        }
    }

    function revealPage() {
        document.body.style.visibility = 'visible';
        console.log('Revealing page and injecting scripts...');
        loadScript('./animations.js');
        loadScript('./script.js');
    }

    function loadScript(src) {
        if (document.querySelector(`script[src="${src}"]`)) return;
        const s = document.createElement('script');
        s.src = src;
        s.defer = false; // force immediate load
        document.body.appendChild(s);
    }
});
