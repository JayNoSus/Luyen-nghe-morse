/**
 * AUDIO ENGINE
 * Quản lý phát âm thanh Morse.
 * Hỗ trợ ưu tiên file âm thanh thật (.wav). Fallback sang giả lập còi bằng Web Audio API.
 */

class MorseAudioEngine {
    constructor() {
        // Khởi tạo Web Audio API Context
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        
        // Master Volume Control
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.8; // Mặc định 80%
        
        this.isMuted = false;
        this.previousVolume = 0.8;

        // Trạng thái
        this.useRealAudio = false;
        this.buffers = {
            dot: null,
            dash: null
        };
        
        this.stopFlag = false; // Cờ dùng để ngắt phát âm thanh ngay lập tức
        this.activeNodes = []; // Lưu các node đang phát để có thể stop
    }

    /**
     * Khởi tạo engine, thử tải file âm thanh thật
     */
    async init() {
        try {
            // Thử tải file âm thanh thật
            const [dotBuffer, dashBuffer] = await Promise.all([
                this.loadSample('assets/sounds/coi-ngan.wav'),
                this.loadSample('assets/sounds/coi-dai.wav')
            ]);
            
            this.buffers.dot = dotBuffer;
            this.buffers.dash = dashBuffer;
            this.useRealAudio = true;
            console.log("Audio Engine: Đã tải file âm thanh còi thật thành công.");
        } catch (error) {
            // Fallback sang giả lập nếu không có file
            this.useRealAudio = false;
            console.log("Audio Engine: Không tìm thấy file âm thanh thật. Chuyển sang chế độ giả lập còi (Web Audio API).");
        }
    }

    /**
     * Tải file audio từ URL
     */
    async loadSample(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        return await this.ctx.decodeAudioData(arrayBuffer);
    }

    /**
     * Cài đặt âm lượng (0.0 đến 1.0)
     */
    setVolume(value) {
        if (this.isMuted) return;
        // Dùng hàm mũ để cảm nhận âm lượng tự nhiên hơn
        this.masterGain.gain.setValueAtTime(value * value, this.ctx.currentTime);
        this.previousVolume = value;
    }

    /**
     * Bật/Tắt tiếng
     */
    mute(isMuted) {
        this.isMuted = isMuted;
        if (isMuted) {
            this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
        } else {
            this.masterGain.gain.setValueAtTime(this.previousVolume * this.previousVolume, this.ctx.currentTime);
        }
    }

    /**
     * Dừng ngay lập tức mọi âm thanh đang phát
     */
    stop() {
        this.stopFlag = true;
        // Dừng tất cả các node âm thanh đang chạy
        this.activeNodes.forEach(node => {
            try {
                node.stop();
                node.disconnect();
            } catch (e) { /* Bỏ qua lỗi nếu node đã dừng */ }
        });
        this.activeNodes = [];
    }

    /**
     * Hàm tiện ích: Ngủ (chờ) một khoảng thời gian ms
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Phát một tín hiệu (Dot hoặc Dash)
     * @param {string} type - '.' hoặc '-'
     * @param {number} durationMs - Thời gian phát tính bằng mili-giây
     */
    async playTone(type, durationMs) {
        if (this.stopFlag) return;

        // Đảm bảo AudioContext đang chạy (trình duyệt thường suspend cho đến khi user tương tác)
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }

        const durationSec = durationMs / 1000;

        if (this.useRealAudio) {
            this.playBuffer(type === '.' ? this.buffers.dot : this.buffers.dash, durationSec);
        } else {
            this.playSimulatedWhistle(durationSec);
        }

        // Chờ cho âm thanh phát xong (cộng thêm 10ms bù trừ độ trễ JS)
        await this.sleep(durationMs + 10);
    }

    /**
     * Phát âm thanh từ file thật
     */
    playBuffer(buffer, durationSec) {
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        
        // Tạo Envelope để tránh tiếng click (lụp bụp) khi ngắt âm thanh đột ngột
        const envGain = this.ctx.createGain();
        envGain.gain.setValueAtTime(0, this.ctx.currentTime);
        envGain.gain.linearRampToValueAtTime(1, this.ctx.currentTime + 0.01); // Attack
        envGain.gain.setValueAtTime(1, this.ctx.currentTime + durationSec - 0.02); // Sustain
        envGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + durationSec); // Release

        source.connect(envGain);
        envGain.connect(this.masterGain);

        source.start(this.ctx.currentTime);
        source.stop(this.ctx.currentTime + durationSec);

        this.activeNodes.push(source);
        
        // Dọn dẹp node sau khi phát xong
        source.onended = () => {
            const index = this.activeNodes.indexOf(source);
            if (index > -1) this.activeNodes.splice(index, 1);
        };
    }

    /**
     * Giả lập tiếng còi trại bằng Web Audio API (Không dùng sóng Sine đơn điệu)
     */
    playSimulatedWhistle(durationSec) {
        const t = this.ctx.currentTime;

        // 1. MAIN OSCILLATOR (Tạo âm thanh gốc của còi - Tần số cao khoảng 2400Hz)
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2400, t);

        // 2. LFO (Low Frequency Oscillator) - Tạo độ rung của hơi thổi
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(45, t); // Rung 45 lần/giây
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(15, t); // Biên độ rung 15Hz
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        // 3. NOISE GENERATOR (Tạo tiếng xì của gió/hơi thổi)
        const bufferSize = this.ctx.sampleRate * durationSec;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        // Lọc tiếng ồn (Chỉ lấy dải tần cao để giống tiếng rít của còi)
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 2500;
        noiseFilter.Q.value = 1.5;
        noise.connect(noiseFilter);

        // 4. ENVELOPE (Định hình âm thanh: Tấn công nhanh, nhả nhanh)
        const envGain = this.ctx.createGain();
        envGain.gain.setValueAtTime(0, t);
        
        // Attack (0.015s)
        envGain.gain.linearRampToValueAtTime(1, t + 0.015);
        // Decay & Sustain
        envGain.gain.exponentialRampToValueAtTime(0.8, t + 0.05);
        // Release (0.02s cuối)
        envGain.gain.setValueAtTime(0.8, t + durationSec - 0.02);
        envGain.gain.linearRampToValueAtTime(0.001, t + durationSec);

        // Trộn Oscillator và Noise
        osc.connect(envGain);
        
        // Giảm âm lượng noise xuống một chút cho đỡ ồn
        const noiseVolume = this.ctx.createGain();
        noiseVolume.gain.value = 0.15;
        noiseFilter.connect(noiseVolume);
        noiseVolume.connect(envGain);

        envGain.connect(this.masterGain);

        // Bắt đầu phát
        osc.start(t);
        lfo.start(t);
        noise.start(t);
        
        osc.stop(t + durationSec);
        lfo.stop(t + durationSec);
        noise.stop(t + durationSec);

        this.activeNodes.push(osc, lfo, noise);

        // Dọn dẹp
        osc.onended = () => {
            const index = this.activeNodes.indexOf(osc);
            if (index > -1) {
                this.activeNodes.splice(index, 1);
            }
        };
    }
}

// Khởi tạo instance toàn cục để các file khác sử dụng
const audioEngine = new MorseAudioEngine();