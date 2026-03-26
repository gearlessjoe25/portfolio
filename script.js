        function showTab(tabName) {
            // Hide all tab contents
            const tabContents = document.querySelectorAll('.tab-content');
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            // Remove active class from all nav tabs
            const navTabs = document.querySelectorAll('.nav-tab');
            navTabs.forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected tab content
            document.getElementById(tabName).classList.add('active');
            
            // Add active class to clicked nav tab
            event.target.classList.add('active');
        }

        // Add some interactive effects
        document.addEventListener('DOMContentLoaded', function() {
            // Animate stat items on load
            const statItems = document.querySelectorAll('.stat-item');
            statItems.forEach((item, index) => {
                setTimeout(() => {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(20px)';
                    item.style.transition = 'all 0.5s ease';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, 100);
                }, index * 100);
            });

            // Add hover effect to frame cards
            const frameCards = document.querySelectorAll('.frame-card');
            frameCards.forEach(card => {
                card.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-5px) scale(1.02)';
                });
                
                card.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0) scale(1)';
                });
            });
        });

        let currentPlayingId = null;

function toggleMusic(id) {
    const audio = document.getElementById(`music-audio-${id}`);
    const button = document.querySelector(`#music-bubble-${id} .music-play-btn`);
    const bubble = document.getElementById(`music-bubble-${id}`);

    // Check if the audio src actually exists
    if (!audio.getAttribute('src') || audio.getAttribute('src').includes('YOUR_MP3_LINK')) {
        alert("Please add a real MP3 link to the HTML code first!");
        return;
    }

    // Pause previously playing audio
    if (currentPlayingId !== null && currentPlayingId !== id) {
        const prevAudio = document.getElementById(`music-audio-${currentPlayingId}`);
        const prevButton = document.querySelector(`#music-bubble-${currentPlayingId} .music-play-btn`);
        const prevBubble = document.getElementById(`music-bubble-${currentPlayingId}`);
        
        prevAudio.pause();
        prevButton.textContent = "▶️";
        prevBubble.classList.remove('playing');
    }

    // Toggle current audio
    if (audio.paused) {
        audio.play().then(() => {
            button.textContent = "⏸️";
            bubble.classList.add('playing');
            currentPlayingId = id;
        }).catch(e => console.error("Audio playback failed:", e));
    } else {
        audio.pause();
        button.textContent = "▶️";
        bubble.classList.remove('playing');
        currentPlayingId = null;
    }

    // Reset when track finishes
    audio.onended = function() {
        button.textContent = "▶️";
        bubble.classList.remove('playing');
        currentPlayingId = null;
    };
}

