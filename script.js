document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('urlInput');
    const getBtn = document.getElementById('getBtn');
    const resultsDiv = document.getElementById('results');
    const errorMsg = document.getElementById('error-msg');

    // Register Service Worker for PWA (if you use it)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .catch(err => console.error('SW Registration Failed', err));
    }

    getBtn.addEventListener('click', processURL);
    
    // Allow pressing "Enter" key
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') processURL();
    });

    function processURL() {
        const url = urlInput.value.trim();
        const videoId = extractVideoID(url);

        if (!videoId) {
            showError();
            return;
        }

        hideError();
        renderThumbnails(videoId);
    }

    function extractVideoID(url) {
        // Updated Regex to handle /live/, /shorts/, /embed/, and standard URLs
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?)|(live\/)|(shorts\/))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[9].length === 11) ? match[9] : false;
    }

    function renderThumbnails(id) {
        // Clear previous results
        resultsDiv.innerHTML = '';
        resultsDiv.classList.remove('hidden');

        // Note: 'maxresdefault' isn't available for every single video, 
        // but 'hqdefault' usually is.
        const qualities = [
            { name: 'Max Resolution (HD)', res: '1920x1080', code: 'maxresdefault' },
            { name: 'Standard Definition', res: '640x480', code: 'sddefault' },
            { name: 'High Quality', res: '480x360', code: 'hqdefault' },
            { name: 'Medium Quality', res: '320x180', code: 'mqdefault' }
        ];

        qualities.forEach(q => {
            const imgUrl = `https://img.youtube.com/vi/${id}/${q.code}.jpg`;
            
            const card = document.createElement('div');
            card.className = 'card';
            
            // We use a "fetch" trick inside the button to force download properly
            card.innerHTML = `
                <img src="${imgUrl}" alt="${q.name}">
                <h3>${q.name}</h3>
                <p>Resolution: ${q.res}</p>
                <button class="download-btn" data-url="${imgUrl}" data-name="${q.code}.jpg">Download Image</button>
            `;
            
            resultsDiv.appendChild(card);
        });

        // Add event listeners to new buttons
        document.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                downloadImage(this.getAttribute('data-url'), this.getAttribute('data-name'));
            });
        });
    }

    function showError() {
        errorMsg.style.display = 'block';
        resultsDiv.classList.add('hidden');
    }

    function hideError() {
        errorMsg.style.display = 'none';
    }
});

// Robust Download Function
async function downloadImage(url, filename) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error('Download failed, opening in new tab fallback', error);
        window.open(url, '_blank');
    }
}