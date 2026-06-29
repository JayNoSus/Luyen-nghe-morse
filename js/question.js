/**
 * QUESTION ENGINE (Nâng cấp: Thuật toán Shuffle Bag)
 * Đảm bảo phát hết kho dữ liệu mới quay vòng lại.
 */

class QuestionManager {
    constructor() {
        this.currentAnswer = "";
        
        // Kho lưu trữ các "túi" câu hỏi còn lại cho từng loại
        this.pools = {
            letters: [],
            words: [],
            commands: [],
            bible: []
        };

        this.stats = {
            correct: 0,
            incorrect: 0,
            streak: 0,
            total: 0
        };
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
     * Lấy câu hỏi tiếp theo từ túi, nếu túi rỗng thì nạp đầy lại
     */
    getNextFromPool(poolKey, sourceData) {
        // Nếu túi rỗng, nạp đầy dữ liệu từ nguồn và xáo trộn
        if (this.pools[poolKey].length === 0) {
            console.log(`Hệ thống: Đã phát hết kho ${poolKey}. Đang nạp lại và xáo trộn vòng mới...`);
            this.pools[poolKey] = this.shuffleArray(sourceData);
        }
        
        // Lấy phần tử cuối cùng ra khỏi túi (pop)
        return this.pools[poolKey].pop();
    }

    /**
     * Sinh câu hỏi mới dựa trên cài đặt
     */
    generateQuestion(mode, dataSource, wordCount) {
        let answer = "";

        if (mode === '1') {
            // Mode 1: Ký tự (A-Z, 0-9)
            answer = this.getNextFromPool('letters', DATA_LETTERS);
        } 
        else if (mode === '2') {
            // Mode 2: Từ vựng
            answer = this.getNextFromPool('words', DATA_WORDS);
        } 
        else if (mode === '3') {
            // Mode 3: Câu hoàn chỉnh
            // Với Mode 3, chúng ta bốc các câu gốc từ kho dữ liệu (Commands hoặc Bible)
            // để đảm bảo người dùng nghe hết các câu mẫu trước khi lặp lại.
            let sourceData = (dataSource === 'commands') ? DATA_COMMANDS : (dataSource === 'bible' ? DATA_BIBLE : DATA_WORDS);
            let poolKey = dataSource; // 'commands' hoặc 'bible' hoặc 'words'

            // Khởi tạo pool cho dataSource nếu chưa có
            if (!this.pools[poolKey]) this.pools[poolKey] = [];

            let rawPhrase = this.getNextFromPool(poolKey, sourceData);
            
            // Xử lý độ dài câu theo Slider (wordCount)
            // Nếu câu bốc ra ngắn hơn wordCount, ta bốc thêm từ kho Words để bù vào cho đủ
            let words = rawPhrase.split(' ');
            
            if (words.length < wordCount) {
                // Bốc thêm từ ngẫu nhiên để đủ số lượng yêu cầu
                while (words.length < wordCount) {
                    let extraWord = DATA_WORDS[Math.floor(Math.random() * DATA_WORDS.length)];
                    words.push(...extraWord.split(' '));
                }
            }
            
            // Cắt đúng số lượng từ yêu cầu
            answer = words.slice(0, wordCount).join(' ');
        }

        this.currentAnswer = answer.toUpperCase().trim().replace(/\s+/g, ' ');
        return this.currentAnswer;
    }

    /**
     * Kiểm tra đáp án
     */
    checkAnswer(userInput) {
        const normalizedInput = userInput.toUpperCase().trim().replace(/\s+/g, ' ');
        const isCorrect = (normalizedInput === this.currentAnswer);

        this.stats.total++;
        if (isCorrect) {
            this.stats.correct++;
            this.stats.streak++;
        } else {
            this.stats.incorrect++;
            this.stats.streak = 0;
        }

        return {
            isCorrect: isCorrect,
            correctAnswer: this.currentAnswer,
            userAnswer: normalizedInput,
            diffHTML: this.generateDiffHTML(this.currentAnswer, normalizedInput)
        };
    }

    generateDiffHTML(correct, user) {
        let html = '';
        const maxLength = Math.max(correct.length, user.length);
        for (let i = 0; i < maxLength; i++) {
            if (i >= user.length) {
                html += `<span class="char-incorrect">_</span>`;
            } else if (i >= correct.length) {
                html += `<span class="char-incorrect">${user[i]}</span>`;
            } else if (correct[i] === user[i]) {
                html += (user[i] === ' ') ? `&nbsp;` : `<span class="char-correct">${user[i]}</span>`;
            } else {
                html += `<span class="char-incorrect">${user[i]}</span>`;
            }
        }
        return html;
    }

    getStats() {
        const rate = this.stats.total === 0 ? 0 : Math.round((this.stats.correct / this.stats.total) * 100);
        return { ...this.stats, rate: rate };
    }
}

const questionManager = new QuestionManager();
