document.addEventListener('DOMContentLoaded', () => {
    const imgs = Array.from(document.images);
    let loaded = 0;
    if (imgs.length === 0) return reveal();
  
    imgs.forEach(img => {
      if (img.complete) check();
      else img.addEventListener('load', check), img.addEventListener('error', check);
    });
  
    function check() {
      if (++loaded === imgs.length) {
        // tiny delay to smooth out rendering glitches
        setTimeout(reveal, 200);
      }
    }
  });
  
  function reveal() {
    document.body.style.visibility = 'visible';
    inject('./animations.js');
    inject('./script.js');
  }
  
  function inject(src) {
    if (document.querySelector(`script[src="${src}"]`)) return;
    const s = document.createElement('script');
    s.src = src;
    document.body.appendChild(s);
  }
  