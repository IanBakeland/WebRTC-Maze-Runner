(function () {
    const script = document.currentScript;
    const count = parseInt(script.dataset.count) || 20;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const size = Math.random() * 3 + 1;
        p.style.cssText = `
            width:${size}px;height:${size}px;
            left:${Math.random() * 100}%;
            bottom:-10px;
            background:${Math.random() > .5 ? 'var(--clr-accent)' : 'var(--clr-accent2)'};
            opacity:${Math.random() * .4 + .1};
            animation-duration:${Math.random() * 12 + 8}s;
            animation-delay:${Math.random() * 10}s;
        `;
        document.body.appendChild(p);
    }
})();
