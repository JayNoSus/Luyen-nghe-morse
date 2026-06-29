/**
 * MORSE ENGINE
 * Xử lý dịch văn bản sang mã Morse và quản lý luồng phát âm thanh theo chuẩn WPM.
 */

// Từ điển Morse Quốc tế (Chỉ dùng A-Z và 0-9, tiếng Việt dùng chuẩn TELEX không dấu)
const MORSE_DICT = {
    'A': '.-',    'B': '-...',  'C': '-.-.',  'D': '-..',
    'E': '.',     'F': '..-.',  'G': '--.',   'H': '....',
    'I': '..',    'J': '.---',  'K': '-.-',   'L': '.-..',
    'M': '--',    'N': '-.',    'O': '---',   'P': '.--.',
    'Q': '--.-',  'R': '.-.',   'S': '...',   'T': '-',
    'U': '..-',   'V': '...-',  'W': '.--',   'X': '-..-',
    'Y': '-.--',  'Z': '--..',
    '0': '-----', '1': '.----', '2': '..---', '3': '...--',
    '4': '....-', '5': '.....', '6': '-....', '7': '--...',
    '8': '---..', '9': '----.'
};

class MorseEngine {
    constructor() {
        this.isPlaying = false;
    }

    /**
     * Dịch một chuỗi văn bản sang mảng các từ, mỗi từ là mảng các ký tự Morse
     * Ví dụ: "SOS" -> [ ["...", "---", "..."] ]
     */
    textToMorse(text) {
        // Chuyển thành chữ in hoa và loại bỏ các ký tự không hỗ trợ
        const cleanText = text.toUpperCase().trim().replace(/[^A-Z0-9 ]/g, '');
        const words = cleanText.split(/\s+/); // Tách theo khoảng trắng
        
        const morseWords = [];
        for (const word of words) {
            const morseChars = [];
            for (const char of word) {
                if (MORSE_DICT[char]) {
                    morseChars.push(MORSE_DICT[char]);
                }
            }
            if (morseChars.length > 0) {
                morseWords.push(morseChars);
            }
        }
        return morseWords;
    }

    /**
     * Tính toán thời gian (ms) cho các thành phần Morse dựa trên WPM
     * Sử dụng chuẩn từ "PARIS" (50 đơn vị thời gian)
     */
    calculateTiming(wpm) {
        const dotDuration = 1200 / wpm; // 1 đơn vị (T)
        
        return {
            dot: dotDuration,                     // Ti: 1T
            dash: dotDuration * 3,                // Te: 3T
            elementSpace: dotDuration,            // Nghỉ giữa Ti/Te trong cùng 1 chữ: 1T
            charSpace: dotDuration * 3,           // Nghỉ giữa các chữ cái trong 1 từ: 3T
            wordSpace: dotDuration * 7            // Nghỉ giữa các từ: 7T
        };
    }

    /**
     * Hàm tiện ích: Ngủ (chờ) một khoảng thời gian ms
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Phát một câu văn bản bằng mã Morse
     * @param {string} text - Văn bản cần phát
     * @param {number} wpm - Tốc độ Words Per Minute
     * @param {function} onStart - Callback khi bắt đầu phát
     * @param {function} onEnd - Callback khi phát xong hoặc bị dừng
     */
    async play(text, wpm, onStart, onEnd) {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        audioEngine.stopFlag = false; // Đặt lại cờ dừng của Audio Engine
        
        if (typeof onStart === 'function') onStart();

        const timing = this.calculateTiming(wpm);
        const morseWords = this.textToMorse(text);

        try {
            // Duyệt qua từng từ
            for (let w = 0; w < morseWords.length; w++) {
                if (audioEngine.stopFlag) break; // Kiểm tra cờ dừng

                const word = morseWords[w];
                
                // Duyệt qua từng chữ cái trong từ
                for (let c = 0; c < word.length; c++) {
                    if (audioEngine.stopFlag) break;

                    const charMorse = word[c];
                    
                    // Duyệt qua từng tín hiệu (Dot/Dash) trong chữ cái
                    for (let i = 0; i < charMorse.length; i++) {
                        if (audioEngine.stopFlag) break;

                        const symbol = charMorse[i];
                        const duration = symbol === '.' ? timing.dot : timing.dash;
                        
                        // Gọi Audio Engine để phát âm thanh
                        await audioEngine.playTone(symbol, duration);

                        // Nghỉ giữa các tín hiệu trong cùng 1 chữ cái (trừ tín hiệu cuối cùng)
                        if (i < charMorse.length - 1) {
                            await this.sleep(timing.elementSpace);
                        }
                    }

                    // Nghỉ giữa các chữ cái trong cùng 1 từ (trừ chữ cái cuối cùng)
                    if (c < word.length - 1 && !audioEngine.stopFlag) {
                        await this.sleep(timing.charSpace);
                    }
                }

                // Nghỉ giữa các từ (trừ từ cuối cùng)
                if (w < morseWords.length - 1 && !audioEngine.stopFlag) {
                    await this.sleep(timing.wordSpace);
                }
            }
        } catch (error) {
            console.error("Lỗi trong quá trình phát Morse:", error);
        } finally {
            this.isPlaying = false;
            if (typeof onEnd === 'function') onEnd();
        }
    }

    /**
     * Dừng phát Morse ngay lập tức
     */
    stop() {
        audioEngine.stop(); // Gọi Audio Engine để ngắt âm thanh
        this.isPlaying = false;
    }
}

// Khởi tạo instance toàn cục
const morseEngine = new MorseEngine();