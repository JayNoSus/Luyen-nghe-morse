/**
 * QUESTION ENGINE
 * Quản lý việc sinh câu hỏi, kiểm tra đáp án và thống kê điểm số.
 */

class QuestionManager {
    constructor() {
        this.currentAnswer = ""; // Lưu đáp án hiện tại (chữ in hoa)
        
        // Bảng thống kê điểm số
        this.stats = {
            correct: 0,
            incorrect: 0,
            streak: 0,
            total: 0
        };
    }

    /**
     * Lấy một phần tử ngẫu nhiên trong mảng
     */
    getRandomItem(array) {
        const randomIndex = Math.floor(Math.random() * array.length);
        return array[randomIndex];
    }

    /**
     * Trộn ngẫu nhiên mảng (Fisher-Yates Shuffle)
     */
    shuffleArray(array) {
        let shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Sinh câu hỏi mới dựa trên cài đặt
     * @param {string} mode - '1' (Ký tự), '2' (Từ vựng), '3' (Câu)
     * @param {string} dataSource - 'commands', 'bible', 'words'
     * @param {number} wordCount - Số lượng từ (dành cho Mode 3)
     * @returns {string} - Câu hỏi đã được tạo
     */
    generateQuestion(mode, dataSource, wordCount) {
        let answer = "";

        if (mode === '1') {
            // Mode 1: 1 Ký tự ngẫu nhiên
            answer = this.getRandomItem(DATA_LETTERS);
        } 
        else if (mode === '2') {
            // Mode 2: 1 Từ vựng ngẫu nhiên (có thể là cụm từ ngắn trong DATA_WORDS)
            answer = this.getRandomItem(DATA_WORDS);
        } 
        else if (mode === '3') {
            // Mode 3: Câu hoàn chỉnh với độ dài tùy chỉnh
            let dataPool = [];
            if (dataSource === 'commands') dataPool = DATA_COMMANDS;
            else if (dataSource === 'bible') dataPool = DATA_BIBLE;
            else dataPool = DATA_WORDS;

            // Xáo trộn kho dữ liệu để lấy ngẫu nhiên
            let pool = this.shuffleArray(dataPool);
            let words = [];

            // Rút trích các từ cho đến khi đủ (hoặc dư) số lượng yêu cầu
            for (let phrase of pool) {
                let phraseWords = phrase.split(' ');
                words = words.concat(phraseWords);
                if (words.length >= wordCount) break;
            }

            // Cắt chính xác số lượng từ người dùng yêu cầu và ghép lại
            answer = words.slice(0, wordCount).join(' ');
        }

        // Lưu lại đáp án chuẩn (In hoa, xóa khoảng trắng thừa)
        this.currentAnswer = answer.toUpperCase().trim().replace(/\s+/g, ' ');
        return this.currentAnswer;
    }

    /**
     * Kiểm tra đáp án của người dùng
     * @param {string} userInput - Chuỗi người dùng nhập vào
     * @returns {object} - Kết quả kiểm tra và mã HTML để hiển thị lỗi
     */
    checkAnswer(userInput) {
        // Chuẩn hóa chuỗi nhập vào
        const normalizedInput = userInput.toUpperCase().trim().replace(/\s+/g, ' ');
        const isCorrect = (normalizedInput === this.currentAnswer);

        // Cập nhật điểm số
        this.stats.total++;
        if (isCorrect) {
            this.stats.correct++;
            this.stats.streak++;
        } else {
            this.stats.incorrect++;
            this.stats.streak = 0; // Đứt chuỗi
        }

        return {
            isCorrect: isCorrect,
            correctAnswer: this.currentAnswer,
            userAnswer: normalizedInput,
            diffHTML: this.generateDiffHTML(this.currentAnswer, normalizedInput)
        };
    }

    /**
     * So sánh từng ký tự để tạo mã HTML bôi đỏ chỗ sai
     */
    generateDiffHTML(correct, user) {
        let html = '';
        const maxLength = Math.max(correct.length, user.length);

        for (let i = 0; i < maxLength; i++) {
            if (i >= user.length) {
                // Người dùng gõ thiếu ký tự
                html += `<span class="char-incorrect">_</span>`;
            } else if (i >= correct.length) {
                // Người dùng gõ dư ký tự
                html += `<span class="char-incorrect">${user[i]}</span>`;
            } else if (correct[i] === user[i]) {
                // Gõ đúng
                if (user[i] === ' ') {
                    html += `&nbsp;`; // Giữ khoảng trắng
                } else {
                    html += `<span class="char-correct">${user[i]}</span>`;
                }
            } else {
                // Gõ sai ký tự
                html += `<span class="char-incorrect">${user[i]}</span>`;
            }
        }
        return html;
    }

    /**
     * Lấy thống kê hiện tại
     */
    getStats() {
        const rate = this.stats.total === 0 ? 0 : Math.round((this.stats.correct / this.stats.total) * 100);
        return {
            ...this.stats,
            rate: rate
        };
    }
}

// Khởi tạo instance toàn cục
const questionManager = new QuestionManager();