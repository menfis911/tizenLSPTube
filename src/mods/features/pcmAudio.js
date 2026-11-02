function requestPart(url, index) {
    const xhr = new XMLHttpRequest();
    const promise = new Promise((resolve, reject) => {
        xhr.open('GET', url + '&chunk=' + index); xhr.responseType = 'arraybuffer'; xhr.timeout = 60000;
        xhr.setRequestHeader('X-LSPTube', '1');
        xhr.onload = () => {
            if (xhr.status !== 200) {
                let message = 'Служба PCM: HTTP ' + xhr.status;
                try {
                    const bytes = new Uint8Array(xhr.response); let encoded = '';
                    if (bytes.length > 4096) throw new Error('Ответ слишком большой');
                    for (const byte of bytes) encoded += '%' + ('0' + byte.toString(16)).slice(-2);
                    message = JSON.parse(decodeURIComponent(encoded)).error || message;
                } catch (_) {}
                reject(new Error(message)); return;
            }
            const frames = Number(xhr.getResponseHeader('X-LSP-Frames')), rate = Number(xhr.getResponseHeader('X-LSP-Rate'));
            if (rate !== 48000 || !Number.isInteger(frames) || frames < 0 || frames > 480000 || xhr.response.byteLength !== frames * 4) {
                reject(new Error('Некорректный PCM-буфер')); return;
            }
            resolve({samples: new Float32Array(xhr.response), frames, rate, start: index * 10,
                ended: xhr.getResponseHeader('X-LSP-End') === '1'});
        };
        xhr.onerror = xhr.ontimeout = () => reject(new Error('Не удалось получить PCM-звук'));
        xhr.onabort = () => reject(new Error('Загрузка PCM отменена'));
        xhr.send();
    });
    return {promise, cancel: () => xhr.abort()};
}

export function createPcmAudio(context, initialPosition = 0, fetchPart = requestPart) {
    const listeners = {}, cache = new Map(), pending = new Map();
    let position = initialPosition, anchor = null, rate = 1, muted = false, wanted = false;
    let volume = 1, driftRate = 1, activeRate = 1;
    let node = null, generation = 0, epoch = 0, timer, starting;
    const audio = {tagName: 'PCM/WebAudio', src: '', paused: true, ended: false, readyState: 0, networkState: 0,
        canPlayType: () => 'PCM через Web Audio', error: null,
        addEventListener(name, fn) { (listeners[name] || (listeners[name] = [])).push(fn); },
        removeEventListener(name, fn) { listeners[name] = (listeners[name] || []).filter(value => value !== fn); },
        removeAttribute(name) { if (name === 'src') audio.src = ''; },
        pause() { restart(); wanted = false; audio.paused = true; },
        play() { wanted = true; audio.paused = false; return start(); },
        load() {
            restart(); wanted = false; audio.paused = true; audio.ended = false; audio.error = null;
            clearInterval(timer); epoch++;
            for (const job of pending.values()) job.cancel();
            pending.clear(); cache.clear(); audio.readyState = 0; audio.networkState = audio.src ? 2 : 0;
            if (!audio.src) return;
            const currentEpoch = epoch; emit('loadstart');
            part(Math.floor(position / 10)).then(() => {
                if (currentEpoch !== epoch) return;
                audio.readyState = 1; emit('loadedmetadata');
                if (wanted) start().catch(() => {});
            }, error => { if (currentEpoch === epoch) failure(error); });
            timer = setInterval(() => {
                if (!wanted || muted) return;
                const index = Math.floor(audio.currentTime / 10);
                part(index + 1).then(data => { if (data.frames) prepareBuffer(data, 0); }).catch(() => {});
                if (!node) start().catch(() => {});
            }, 200);
        }
    };
    function emit(name) {
        for (const fn of listeners[name] || []) fn({type: name, target: audio});
        if (typeof audio['on' + name] === 'function') audio['on' + name]({type: name, target: audio});
    }
    function failure(error) {
        if (!audio.src || audio.error) return;
        audio.error = {code: 4, message: error.message}; audio.networkState = 3; audio.readyState = 0;
        emit('error');
    }
    function restart() {
        position = audio.currentTime; anchor = null; generation++; starting = null;
        if (node) { const old = node; node = null;
            try { old.stop(0); } catch (_) {}
            if (old.disconnect) { try { old.disconnect(); } catch (_) {} }
        }
    }
    function part(index) {
        if (cache.has(index)) {
            const value = cache.get(index);
            return value.error ? Promise.reject(value.error) : Promise.resolve(value);
        }
        if (pending.has(index)) return pending.get(index).promise;
        if (index >= 1440) return Promise.resolve({samples: new Float32Array(0), frames: 0, rate: 48000, start: index * 10, ended: true});
        const currentEpoch = epoch, job = fetchPart(audio.src, index);
        const promise = job.promise.then(data => {
            if (epoch !== currentEpoch) throw new Error('Сеанс PCM изменился');
            cache.set(index, data);
            while (cache.size > 3) cache.delete(cache.keys().next().value);
            return data;
        }).catch(error => {
            if (epoch === currentEpoch) {
                cache.set(index, {error});
                while (cache.size > 3) cache.delete(cache.keys().next().value);
            }
            throw error;
        }).finally(() => { if (epoch === currentEpoch) pending.delete(index); });
        pending.set(index, {promise, cancel: job.cancel}); return promise;
    }
    function prepareBuffer(data, offset) {
        if (offset === 0 && data.buffer && data.bufferRate === rate * driftRate && data.bufferVolume === volume) return data.buffer;
        const buffer = context.createBuffer(1, data.frames - offset, data.rate * rate * driftRate);
        const samples = data.samples.subarray(offset);
        buffer.copyToChannel(volume === 1 ? samples : samples.map(sample => sample * volume), 0, 0);
        if (offset === 0) { data.buffer = buffer; data.bufferRate = rate * driftRate; data.bufferVolume = volume; }
        return buffer;
    }
    function start() {
        if (!wanted || node) return Promise.resolve();
        if (muted) { activeRate = rate; anchor = context.currentTime; audio.readyState = 4; return Promise.resolve(); }
        if (starting) return starting;
        const currentGeneration = generation;
        starting = (async () => {
            if (context.resume) await context.resume();
            const data = await part(Math.floor(position / 10));
            if (!wanted || currentGeneration !== generation) return;
            const offset = Math.max(0, Math.floor((position - data.start) * data.rate));
            if (offset >= data.frames) { audio.ended = true; wanted = false; audio.paused = true; emit('ended'); return; }
            const buffer = prepareBuffer(data, offset);
            const source = context.createBufferSource(); source.buffer = buffer; source.connect(context.destination);
            source.onended = () => {
                if (node !== source || generation !== currentGeneration) return;
                position = data.start + data.frames / data.rate; anchor = null; node = null;
                if (source.disconnect) source.disconnect();
                if (data.ended) { audio.ended = true; wanted = false; audio.paused = true; emit('ended'); }
                else { audio.readyState = 2; emit('waiting'); start().catch(() => {}); }
            };
            node = source; anchor = context.currentTime; activeRate = buffer.sampleRate / data.rate;
            // Cobalt 22 supports only start(0): crop the buffer instead of passing a seek offset.
            source.start(0); audio.readyState = 4; audio.networkState = 1; emit('playing');
        })().catch(error => { if (generation === currentGeneration) failure(error); throw error; })
            .finally(() => { if (generation === currentGeneration) starting = null; });
        return starting;
    }
    Object.defineProperties(audio, {
        driftRate: {get: () => driftRate, set(value) {
            if (Number.isFinite(value) && value >= .97 && value <= 1.03) driftRate = value;
        }},
        sourceActive: {get: () => node !== null},
        volume: {get: () => volume, set(value) { if (!Number.isFinite(value) || value < 0 || value > 1 || value === volume) return;
            restart(); volume = value; if (wanted) start().catch(() => {}); }},
        currentTime: {get: () => position + (anchor === null ? 0 : (context.currentTime - anchor) * activeRate),
            set(value) { if (!Number.isFinite(value) || value < 0) return; restart(); position = value; audio.ended = false;
                if (wanted) start().catch(() => {}); }},
        playbackRate: {get: () => rate, set(value) { if (!Number.isFinite(value) || value <= 0 || value === rate) return;
            restart(); rate = value; if (wanted) start().catch(() => {}); }},
        muted: {get: () => muted, set(value) { if (!!value === muted) return;
            restart(); muted = !!value; if (wanted) start().catch(() => {}); }}
    });
    return audio;
}
