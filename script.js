document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('urlInput');
    const getBtn = document.getElementById('getBtn');
    const resultsDiv = document.getElementById('results');
    const errorMsg = document.getElementById('error-msg');
    const videoInfo = document.getElementById('video-info');
    const videoTitle = document.getElementById('video-title');
    const videoAbout = document.getElementById('video-about');

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .catch(err => console.error('SW Registration Failed', err));
    }

    getBtn.addEventListener('click', processURL);

    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            processURL();
        }
    });

    async function processURL() {
        const url = urlInput.value.trim();
        const videoId = extractVideoID(url);

        if (!videoId) {
            showError();
            return;
        }

        hideError();
        renderThumbnails(videoId);
        await renderVideoDetails(videoId);
    }

    function extractVideoID(url) {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?)|(live\/)|(shorts\/))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[9].length === 11) ? match[9] : false;
    }

    async function renderVideoDetails(videoId) {
        const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        const info = await getVideoInfo(videoId);

        videoTitle.textContent = info.title;
        videoAbout.textContent = `${info.about} Thumbnail source: YouTube CDN (${videoId}).`;
        videoInfo.classList.remove('hidden');
        videoInfo.style.backgroundImage = `linear-gradient(rgba(18, 18, 18, 0.88), rgba(18, 18, 18, 0.88)), url(${thumbUrl})`;
    }

    async function getVideoInfo(videoId) {
        const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

        try {
            const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(watchUrl)}`);

            if (!response.ok) {
                throw new Error('Noembed request failed');
            }

            const data = await response.json();
            const author = data.author_name ? ` by ${data.author_name}` : '';

            return {
                title: data.title || `Video ${videoId}`,
                about: `Showing available thumbnail formats for this video${author}.`
            };
        } catch (error) {
            console.warn('Could not load title from noembed, using fallback.', error);
            return {
                title: `Video ${videoId}`,
                about: 'Showing available thumbnail formats for this video.'
            };
        }
    }

    function renderThumbnails(id) {
        resultsDiv.innerHTML = '';
        resultsDiv.classList.remove('hidden');

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

            card.innerHTML = `
                <img src="${imgUrl}" alt="${q.name}">
                <h3>${q.name}</h3>
                <p>Resolution: ${q.res}</p>
                <button class="download-btn" data-url="${imgUrl}" data-name="${q.code}.jpg">Download Image</button>
            `;

            resultsDiv.appendChild(card);
        });

        document.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                downloadImage(this.getAttribute('data-url'), this.getAttribute('data-name'));
            });
        });
    }

    function showError() {
        errorMsg.style.display = 'block';
        resultsDiv.classList.add('hidden');
        videoInfo.classList.add('hidden');
    }

    function hideError() {
        errorMsg.style.display = 'none';
    }
});

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
