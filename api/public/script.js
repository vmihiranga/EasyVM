document.addEventListener('DOMContentLoaded', () => {
    const _0x1a = document.getElementById('videoLink');
    const _0xpaste = document.getElementById('pasteBtn');
    const _0x2b = document.getElementById('convertBtn');
    const _0x3c = _0x2b.querySelector('.btn-text');
    const _0x4d = _0x2b.querySelector('.btn-loader');
    const _0x5e = document.getElementById('resultArea');
    const _0x6f = document.getElementById('errorArea');
    const _0xrc = document.getElementById('resultContent');

    let _session_at = '';
    let _active_m = 'mp3';

    // Tab Logic
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            _active_m = btn.dataset.type;
            
            // Show/Hide Quality Select
            const qSelect = document.getElementById('qualitySelect');
            if (_active_m === 'mp3' || _active_m === 'mp4') {
                qSelect.style.display = 'block';
            } else {
                qSelect.style.display = 'none';
            }

            // Clear input and results
            _0x1a.value = '';
            _0x1a.focus();
            _hide();
        });
    });

    _0xpaste.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            _0x1a.value = text;
            _0x1a.focus();
        } catch (err) {
            console.error('Failed to read clipboard contents: ', err);
            _err("Clipboard access denied.");
        }
    });



    async function _init() {
        try {
            const r = await fetch('/api/v1/auth/session');
            const d = await r.json();
            _session_at = d._sid;
        } catch (e) {}
    }
    _init();

    _0x2b.addEventListener('click', async () => {
        const _lnk = _0x1a.value.trim();
        if (!_lnk) return _err('Paste link.');
        
        _load(true);
        _hide();

        try {
            const modeMap = {
                'mp3': 'a1', 'mp4': 'b2', 'tiktok': 'c3', 
                'fb': 'd4', 'tw': 'e5', 'capcut': 'f6', 'gdrive': 'g7'
            };
            const _op_mapped = modeMap[_active_m] || _active_m;
            const _ql = document.getElementById('qualitySelect').value;

            const _enc_u = btoa(_lnk);
            if(!_session_at) await _init();

            // Updated parameters: _px, _tk, _op, _ql
            const _url = `/api/v1/proc/exec?_px=${encodeURIComponent(_enc_u)}&_tk=${_session_at}&_op=${_op_mapped}&_ql=${_ql}`;

            
            const r = await fetch(_url, {
                headers: {
                    'X-EVM-Source': 'verified-app'
                }
            });
            
            const contentType = r.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const d = await r.json();
                if (d.error) {
                    _err(d.error);
                    if(d.error.includes('Session') || d.error.includes('Security')) _init();
                } else {
                    _render(d);
                }
            } else {
                _err("Security check failed or server error.");
            }
        } catch (e) {
            _err(`Connection failed.`);
        } finally {
            _load(false);
        }



    });

    function _render(d) {
        _0xrc.innerHTML = '';
        const item = document.createElement('div');
        item.className = 'result-item';

        let title = d.title || d.filename || d.author || 'Download Ready';
        let thumb = d.thumbnail || 'https://via.placeholder.com/150/000000/FFFFFF?text=No+Preview';
        let author = d.author || '';
        let dlHtml = '';

        // Handle Vreden YouTube Response
        if (d.result && d.result.metadata) {
            title = d.result.metadata.title;
            thumb = d.result.metadata.thumbnail;
            author = d.result.metadata.author ? d.result.metadata.author.name : '';
            if (d.result.download && d.result.download.url) {
                dlHtml = `<a href="${d.result.download.url}" class="dl-link" target="_blank"><i class="fas fa-download"></i> Download ${d.result.download.quality || ''}</a>`;
            }
        } 
        // Handle CapCut Response
        else if (d.result && d.result.media && Array.isArray(d.result.media)) {
            title = d.result.title || 'CapCut Video';
            thumb = d.result.thumbnail || thumb;
            d.result.media.forEach(m => {
                dlHtml += `<a href="${m.url}" class="dl-link" target="_blank"><i class="fas fa-video"></i> Download (${m.quality || m.size_format})</a>`;
            });
        }
        // Handle GDrive Response
        else if (d.result && d.result.file) {
            title = d.result.file.name;
            thumb = d.result.uploader ? d.result.uploader.profile : thumb;
            author = d.result.uploader ? d.result.uploader.name : '';
            dlHtml = `<a href="${d.result.file.download}" class="dl-link" target="_blank"><i class="fas fa-file-archive"></i> Download (${d.result.file.mimetype})</a>`;
        }
        // Handle Sadas/Old tunnel format
        else if (d.status === 'tunnel' && d.url) {
            dlHtml = `<a href="${d.url}" class="dl-link" download><i class="fas fa-download"></i> Download ${_active_m.toUpperCase()}</a>`;
        } 
        // Handle TikTok format
        else if (d.no_watermark) {
            dlHtml = `
                <a href="${d.no_watermark}" class="dl-link" target="_blank"><i class="fas fa-video"></i> No Watermark</a>
                <a href="${d.watermark}" class="dl-link" target="_blank"><i class="fas fa-video"></i> With Watermark</a>
                <a href="${d.music}" class="dl-link" target="_blank"><i class="fas fa-music"></i> Download Audio</a>
            `;
        } 
        // Handle FB or Twitter format
        else if (d.data && (d.data.low || d.data.high || d.data.HD || d.data.SD)) {
            const links = d.data;
            if (links.high) dlHtml += `<a href="${links.high}" class="dl-link" target="_blank"><i class="fas fa-hd"></i> High Quality</a>`;
            if (links.low) dlHtml += `<a href="${links.low}" class="dl-link" target="_blank"><i class="fas fa-sd"></i> Low Quality</a>`;
            if (links.HD) dlHtml += `<a href="${links.HD}" class="dl-link" target="_blank"><i class="fas fa-hd"></i> HD Video</a>`;
            if (links.SD) dlHtml += `<a href="${links.SD}" class="dl-link" target="_blank"><i class="fas fa-sd"></i> SD Video</a>`;
        }

        item.innerHTML = `
            <div class="result-meta">
                <img src="${thumb}" class="result-thumb" onerror="this.src='https://via.placeholder.com/150/000000/FFFFFF?text=Preview'">
                <div class="result-info">
                    <h3>${title}</h3>
                    ${author ? `<p>By: ${author}</p>` : ''}
                </div>
            </div>
            <div class="download-options">
                ${dlHtml || '<p>No download links found.</p>'}
            </div>
        `;

        _0xrc.appendChild(item);
        _0x5e.classList.remove('hidden');
    }


    function _load(s) {
        _0x2b.disabled = s;
        s ? (_0x3c.classList.add('hidden'), _0x4d.classList.remove('hidden')) : (_0x3c.classList.remove('hidden'), _0x4d.classList.add('hidden'));
    }

    function _err(m) {
        _0x6f.querySelector('span').textContent = m;
        _0x6f.classList.remove('hidden');
    }

    function _hide() {
        _0x6f.classList.add('hidden');
        _0x5e.classList.add('hidden');
    }

    // Security: Disable Right Click, Inspect, View Source
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    document.addEventListener('keydown', (e) => {
        // Disable F12
        if (e.keyCode === 123) {
            e.preventDefault();
            return false;
        }

        // Disable Ctrl+Shift+I/J (Inspect/Console)
        if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) {
            e.preventDefault();
            return false;
        }

        // Disable Ctrl+U (View Source)
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            return false;
        }

        // Disable Ctrl+S (Save)
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            return false;
        }
    });

    _0x1a.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') _0x2b.click();
    });
});

