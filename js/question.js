/**
 * QUESTION ENGINE (Pro Version)
 * Thuật toán Shuffle Bag + Bộ dịch Việt - Telex chuẩn xác 100%
 */

class QuestionManager {
    constructor() {
        this.currentAnswer = ""; 
        this.currentTelex = "";  
        this.activeItem = null;  
        this.activePoolKey = ""; 
        
        this.pools = { letters: [], words: [], commands: [], bible: [] };
        this.stats = { correct: 0, incorrect: 0, streak: 0, total: 0 };
    }

    shuffleArray(array) {
        let shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Dịch Tiếng Việt có dấu sang TELEX chuẩn để còi thổi
     */
    vietnameseToTelex(text) {
        if (!text) return "";
        
        const words = text.toLowerCase().split(' ');
        const result = words.map(word => {
            let tone = '';
            
            // 1. Tách dấu thanh (Tone)
            if (/[áấắéếíóốớúứý]/.test(word)) tone = 's';
            else if (/[àầằèềìòồờùừỳ]/.test(word)) tone = 'f';
            else if (/[ảẩẳẻểỉỏổởủửỷ]/.test(word)) tone = 'r';
            else if (/[ãẫẵẽễĩõỗỡũữỹ]/.test(word)) tone = 'x';
            else if (/[ạậặẹệịọộợụựỵ]/.test(word)) tone = 'j';

            // 2. Chuyển chữ có dấu về chữ gốc (a, e, i, o, u, d)
            let base = word
                .replace(/[áàảãạ]/g, 'a').replace(/[ấầẩẫậ]/g, 'â').replace(/[ắằẳẵặ]/g, 'ă')
                .replace(/[éèẻẽẹ]/g, 'e').replace(/[ếềểễệ]/g, 'ê')
                .replace(/[íìỉĩị]/g, 'i')
                .replace(/[óòỏõọ]/g, 'o').replace(/[ốồổỗộ]/g, 'ô').replace(/[ớờởỡợ]/g, 'ơ')
                .replace(/[úùủũụ]/g, 'u').replace(/[ứừửữự]/g, 'ư')
                .replace(/[ýỳỷỹỵ]/g, 'y')
                .replace(/đ/g, 'dd');

            // 3. Quy đổi mũ/móc sang Telex (aw, aa, ee, oo, ow, uw)
            base = base
                .replace(/ươ/g, 'uow') // Ví dụ: trường -> truowngf
                .replace(/â/g, 'aa')
                .replace(/ă/g, 'aw')
                .replace(/ê/g, 'ee')
                .replace(/ô/g, 'oo')
                .replace(/ơ/g, 'ow')
                .replace(/ư/g, 'uw');

            return (base + tone).toUpperCase();
        });

        return result.join(' ');
    }

    generateQuestion(mode, dataSource, wordCount) {
        let answer = "";
        let poolKey = (mode === '1') ? 'letters' : ((mode === '2') ? 'words' : dataSource);
        this.activePoolKey = poolKey;

        let sourceData = (mode === '1') ? DATA_LETTERS : 
                         (mode === '2') ? DATA_WORDS : 
                         (dataSource === 'commands') ? DATA_COMMANDS : 
                         (dataSource === 'bible' ? DATA_BIBLE : DATA_WORDS);

        // Đổ đầy và xáo trộn túi nếu túi rỗng
        if (!this.pools[poolKey] || this.pools[poolKey].length === 0) {
            this.pools[poolKey] = this.shuffleArray(sourceData);
        }

        // Rút câu ra khỏi túi
        let rawItem = this.pools[poolKey].pop();
        this.activeItem = rawItem; 

        if (mode === '3') {
            let words = rawItem.split(' ');
            if (words.length < wordCount) {
                while (words.length < wordCount) {
                    let extra = DATA_WORDS[Math.floor(Math.random() * DATA_WORDS.length)];
                    words.push(...extra.split(' '));
                }
            }
            answer = words.slice(0, wordCount).join(' ');
        } else {
            answer = rawItem;
        }

        this.currentAnswer = answer.trim(); 
        this.currentTelex = this.vietnameseToTelex(this.currentAnswer); 
        
        return this.currentAnswer;
    }

    /**
     * Bỏ câu hỏi lại vào túi nếu bấm Bỏ Qua (Skip)
     */
    skipAndReturn() {
        if (this.activeItem && this.activePoolKey) {
            this.pools[this.activePoolKey].unshift(this.activeItem);
        }
    }

    checkAnswer(userInput) {
        const cleanUser = userInput.toLowerCase().trim().replace(/\s+/g, ' ');
        const cleanCorrect = this.currentAnswer.toLowerCase().trim().replace(/\s+/g, ' ');
        
        const isCorrect = (cleanUser === cleanCorrect);
        let cycleCompleted = false;

        this.stats.total++;
        if (isCorrect) {
            this.stats.correct++;
            this.stats.streak++;
            if (this.pools[this.activePoolKey].length === 0) cycleCompleted = true;
        } else {
            this.stats.incorrect++;
            this.stats.streak = 0;
            // Nhét lại vào đáy túi để học lại
            this.pools[this.activePoolKey].unshift(this.activeItem);
        }

        return {
            isCorrect: isCorrect,
            correctAnswer: this.currentAnswer,
            userAnswer: userInput,
            diffHTML: this.generateDiffHTML(this.currentAnswer, userInput),
            cycleCompleted: cycleCompleted
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
            } else if (correct[i].toLowerCase() === user[i].toLowerCase()) {
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