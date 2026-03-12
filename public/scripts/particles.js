const randomBetween = (min, max) => Math.random() * (max - min) + min;

export const createParticles = (count = 20) => {
    const total = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 20;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < total; i++) {
        const particle = document.createElement('div');
        const size = randomBetween(1, 4);

        particle.className = 'particle';
        particle.style.cssText = `
            width:${size}px;
            height:${size}px;
            left:${randomBetween(0, 100)}%;
            bottom:-10px;
            background:${Math.random() > 0.5 ? 'var(--clr-accent)' : 'var(--clr-accent2)'};
            opacity:${randomBetween(0.1, 0.5)};
            animation-duration:${randomBetween(8, 20)}s;
            animation-delay:${randomBetween(0, 10)}s;
        `;

        fragment.appendChild(particle);
    }

    document.body.appendChild(fragment);
};
