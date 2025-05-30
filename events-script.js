document.addEventListener('DOMContentLoaded', () => {
    const carouselTrack = document.querySelector('.carousel-track');
    const originalCards = Array.from(document.querySelectorAll('.card'));
    const leftArrow = document.querySelector('#larrow');
    const rightArrow = document.querySelector('#rarrow');

    // Clone the first and last cards dynamically
    const firstClone = originalCards.slice(0, 3).map(card => card.cloneNode(true));
    const lastClone = originalCards.slice(-3).map(card => card.cloneNode(true));

    // Append clones to the track
    lastClone.forEach(card => carouselTrack.prepend(card));
    firstClone.forEach(card => carouselTrack.append(card));

    // Update cards list
    const cards = Array.from(document.querySelectorAll('.card'));
    let currentIndex = 3; // Start at the first real card
    let cardsVisible = 3; // Default visible cards (desktop)

    // Function to update the number of visible cards and recalculate offsets
    function updateVisibleCards() {
        const width = window.innerWidth;

        if (width < 767) {
            cardsVisible = 1;
        } else if (width < 1400) {
            cardsVisible = 2;
        } else {
            cardsVisible = 3;
        }
        currentIndex = cardsVisible; // Reset to ensure proper alignment
        updateCarousel(true); // Call with `true` to skip transition
    }

    // Function to update the carousel position
    function updateCarousel(skipTransition = false) {
        const cardWidth = cards[0].offsetWidth + 14; // card width + gap
        const offset = currentIndex * cardWidth;

        if (skipTransition) {
            carouselTrack.style.transition = 'none'; // Skip animation
        } else {
            carouselTrack.style.transition = 'transform 0.3s ease-in-out';
        }
        carouselTrack.style.transform = `translateX(-${offset}px)`;
    }

    // Adjust position instantly (no animation) for infinite looping
    function adjustForLoop() {
        const cardWidth = cards[0].offsetWidth + 14; // card width + gap
        if (currentIndex === 0) {
            currentIndex = cards.length - cardsVisible * 2; // Jump to last set of real cards
            carouselTrack.style.transition = 'none';
            carouselTrack.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
        } else if (currentIndex === cards.length - cardsVisible) {
            currentIndex = cardsVisible; // Jump to first set of real cards
            carouselTrack.style.transition = 'none';
            carouselTrack.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
        }
    }

    // Right arrow click
    rightArrow.addEventListener('click', () => {
        currentIndex++;
        updateCarousel();
        setTimeout(adjustForLoop, 300); // Wait for transition to complete
    });

    // Left arrow click
    leftArrow.addEventListener('click', () => {
        currentIndex--;
        updateCarousel();
        setTimeout(adjustForLoop, 300); // Wait for transition to complete
    });

    // Handle window resize
    window.addEventListener('resize', updateVisibleCards);

    // Initialize on load
    window.addEventListener('load', () => {
        updateVisibleCards(); // Set initial visible cards
        setTimeout(() => {
            updateCarousel(true); // Align properly after DOM rendering
        }, 100);
    });

    // Get modal elements
    const modal = document.getElementById('modal');
    const triggerDiv = document.querySelectorAll("#triggerDiv")
    console.log(triggerDiv)
    const closeBtn = document.querySelector('.close');

    // Open modal when trigger div is clicked
    triggerDiv.forEach((e) => {
        e.addEventListener('click', () => {
            console.log("Trigger Clicked");
            modal.style.display = 'block';
        });
    });

    // Close modal when close button is clicked
    closeBtn.addEventListener('click', () => {
        console.log("Close Clicked");
        modal.style.display = 'none';
    });

    // Close modal when clicking outside the modal content
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});