document.querySelectorAll('.grid-card').forEach(card => {
    card.addEventListener('mouseover', () => {
        card.querySelector('.hover-circle').classList.add('visible');
    });
    card.addEventListener('mouseout', () => {
        card.querySelector('.hover-circle').classList.remove('visible');
    });
    card.addEventListener('click', () => {
        window.location.href = "./specific-paper.html";
    })
});
