/**
 * MAIN CONTROLLER
 * Điều phối giao diện và kết nối các module (Audio, Morse, Question).
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. KHAI BÁO CÁC PHẦN TỬ DOM
    // ==========================================

    // Sliders Spacing mới
    const charSpaceSlider = document.getElementById('charSpaceSlider');
    const charSpaceValue = document.getElementById('charSpaceValue');
    const wordSpaceSlider = document.getElementById('wordSpaceSlider');
    const wordSpaceValue = document.getElementById('wordSpaceValue');

    // Congrats Modal
    const congratsModal = document.getElementById('congratsModal');
    const closeCongratsBtn = document.getElementById('closeCongratsBtn');
    
    // Cài đặt
    const modeRadios = document.querySelectorAll('input[name="mode"]');
    const dataSourceGroup = document.getElementById('dataSourceGroup');
    const dataSourceSelect = document.getElementById('dataSource');
    const wordCountGroup = document.getElementById('wordCountGroup');
    const wordCountSlider = document.getElementById('wordCountSlider');
    const wordCountValue = document.getElementById('wordCountValue');
    const wpmSlider = document.getElementById('wpmSlider');
    const wpmValue = document.getElementById('wpmValue');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.getElementById('volumeValue');
    const muteBtn = document.getElementById('muteBtn');
    const muteIcon = document.getElementById('muteIcon');

    // Thống kê
    const statCorrect = document.getElementById('statCorrect');
    const statIncorrect = document.getElementById('statIncorrect');
    const statStreak = document.getElementById('statStreak');
    const statRate = document.getElementById('statRate');

    // Điều khiển & Nhập liệu
    const statusIndicator = document.getElementById('statusIndicator');
    const playBtn = document.getElementById('playBtn');
    const replayBtn = document.getElementById('replayBtn');
    const stopBtn = document.getElementById('stopBtn');
    const answerInput = document.getElementById('answerInput');
    const checkBtn = document.getElementById('checkBtn');
    const showAnswerBtn = document.getElementById('showAnswerBtn');
    const nextBtn = document.getElementById('nextBtn');

    // Kết quả
    const feedbackSection = document.getElementById('feedbackSection');
    const feedbackTitle = document.getElementById('feedbackTitle');
    const correctAnswerText = document.getElementById('correctAnswerText');
    const userAnswerText = document.getElementById('userAnswerText');

    // Biến trạng thái
    let isAudioInitialized = false;
    let hasAnswered = false; // Đánh dấu câu hỏi hiện tại đã trả lời chưa

    // ==========================================
    // 2. HÀM TIỆN ÍCH & CẬP NHẬT GIAO DIỆN
    // ==========================================

    // Cập nhật bảng điểm
    function updateStatsUI() {
        const stats = questionManager.getStats();
        statCorrect.textContent = stats.correct;
        statIncorrect.textContent = stats.incorrect;
        statStreak.textContent = stats.streak;
        statRate.textContent = stats.rate + '%';
    }

    // Khởi tạo Audio Engine (Chỉ gọi khi user click lần đầu để lách luật Autoplay của trình duyệt)
    async function ensureAudioInit() {
        if (!isAudioInitialized) {
            await audioEngine.init();
            isAudioInitialized = true;
        }
    }

    // ==========================================
    // 3. LOGIC LUYỆN TẬP CHÍNH
    // ==========================================

    // Tạo câu hỏi mới
    async function generateNewQuestion() {
        await ensureAudioInit();
        
        // Lấy cấu hình hiện tại
        const selectedMode = document.querySelector('input[name="mode"]:checked').value;
        const source = dataSourceSelect.value;
        const words = parseInt(wordCountSlider.value);

        // Sinh câu hỏi
        questionManager.generateQuestion(selectedMode, source, words);
        
        // Reset UI
        answerInput.value = '';
        answerInput.disabled = false;
        checkBtn.disabled = false;
        showAnswerBtn.disabled = false;
        replayBtn.disabled = false;
        hasAnswered = false;
        
        feedbackSection.style.display = 'none';
        feedbackSection.className = 'feedback-section card elevation-1'; // Reset class
        
        // Tự động phát
        playCurrentQuestion();
    }

    // Phát mã Morse
    async function playCurrentQuestion() {
        await ensureAudioInit();
        
        // Thổi theo mã TELEX đã được dịch tự động
        const textToPlay = questionManager.currentTelex; 
        const wpm = parseInt(wpmSlider.value);
        const charMul = parseFloat(charSpaceSlider.value);
        const wordMul = parseFloat(wordSpaceSlider.value);

        if (!textToPlay) return;

        statusIndicator.textContent = 'Đang phát...';
        statusIndicator.classList.add('playing');
        playBtn.disabled = true;
        replayBtn.disabled = true;
        stopBtn.disabled = false;
        nextBtn.disabled = true;

        // Truyền thêm charMul và wordMul vào Morse Engine
        morseEngine.play(textToPlay, wpm, charMul, wordMul, null, () => {
            statusIndicator.textContent = 'Sẵn sàng';
            statusIndicator.classList.remove('playing');
            playBtn.disabled = false;
            replayBtn.disabled = false;
            stopBtn.disabled = true;
            nextBtn.disabled = false;
            if (!hasAnswered) {
                answerInput.focus();
            }
        });
    }

    // Dừng phát
    function stopPlaying() {
        morseEngine.stop();
    }

    // Kiểm tra đáp án
    function submitAnswer() {
        if (hasAnswered || !questionManager.currentAnswer) return;
        
        const userInput = answerInput.value;
        if (userInput.trim() === '') return;

        hasAnswered = true;
        const result = questionManager.checkAnswer(userInput);
        
        updateStatsUI();
        showFeedback(result);
        
        answerInput.disabled = true;
        checkBtn.disabled = true;
        showAnswerBtn.disabled = true;
        
        // KIỂM TRA NẾU HOÀN THÀNH VÒNG (CYCLE COMPLETED)
        if (result.cycleCompleted) {
            congratsModal.style.display = 'flex';
        } else {
            nextBtn.focus();
        }
    }

    // Bỏ cuộc / Hiện đáp án
    function giveUp() {
        if (hasAnswered || !questionManager.currentAnswer) return;
        
        hasAnswered = true;
        // Gửi chuỗi rỗng để tính là sai
        const result = questionManager.checkAnswer(""); 
        
        updateStatsUI();
        showFeedback(result);
        
        answerInput.disabled = true;
        checkBtn.disabled = true;
        showAnswerBtn.disabled = true;
        nextBtn.focus();
    }

    // Hiển thị khung kết quả
    function showFeedback(result) {
        feedbackSection.style.display = 'block';
        
        // CẬP NHẬT: Hiện cả tiếng Việt và Telex
        correctAnswerText.innerHTML = `${result.correctAnswer} <br><small style="color: var(--warning-glow); font-size: 0.9em;">(Còi thổi: ${questionManager.currentTelex})</small>`;
        userAnswerText.innerHTML = result.diffHTML;

        if (result.isCorrect) {
            feedbackSection.classList.add('correct');
            feedbackSection.classList.remove('incorrect');
            feedbackTitle.textContent = 'Tuyệt vời! Chính xác.';
            feedbackTitle.className = 'feedback-title text-success';
        } else {
            feedbackSection.classList.add('incorrect');
            feedbackSection.classList.remove('correct');
            feedbackTitle.textContent = 'Sai rồi! Hãy thử lại nhé.';
            feedbackTitle.className = 'feedback-title text-danger';
        }
    }

    // ==========================================
    // 4. LẮNG NGHE SỰ KIỆN (EVENT LISTENERS)
    // ==========================================

    // Thay đổi Mode
    modeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const mode = e.target.value;
            if (mode === '1') {
                dataSourceGroup.style.display = 'none';
                wordCountGroup.style.display = 'none';
            } else if (mode === '2') {
                dataSourceGroup.style.display = 'block';
                wordCountGroup.style.display = 'none';
            } else {
                dataSourceGroup.style.display = 'block';
                wordCountGroup.style.display = 'block';
            }
        });
    });

    // Sliders
    wpmSlider.addEventListener('input', (e) => {
        wpmValue.textContent = e.target.value + ' WPM';
    });

    wordCountSlider.addEventListener('input', (e) => {
        wordCountValue.textContent = e.target.value + ' từ';
    });

    volumeSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        volumeValue.textContent = val + '%';
        audioEngine.setVolume(val / 100);
        
        // Tự động unmute nếu đang mute mà kéo volume
        if (audioEngine.isMuted && val > 0) {
            audioEngine.mute(false);
            muteIcon.textContent = 'volume_up';
        }
    });

    // Sự kiện cho Sliders Spacing mới
    charSpaceSlider.addEventListener('input', (e) => {
        charSpaceValue.textContent = parseFloat(e.target.value).toFixed(1) + 'x';
    });

    wordSpaceSlider.addEventListener('input', (e) => {
        wordSpaceValue.textContent = parseFloat(e.target.value).toFixed(1) + 'x';
    });

    // Sự kiện đóng Modal chúc mừng
    closeCongratsBtn.addEventListener('click', () => {
        congratsModal.style.display = 'none';
        generateNewQuestion(); // Chuyển sang vòng mới luôn
    });

    // Mute Button
    muteBtn.addEventListener('click', () => {
        const isMuted = !audioEngine.isMuted;
        audioEngine.mute(isMuted);
        muteIcon.textContent = isMuted ? 'volume_off' : 'volume_up';
    });

    // Nút Câu mới (Skip)
    nextBtn.addEventListener('click', () => {
        stopPlaying();
        
        // CẬP NHẬT: Nếu chưa trả lời mà skip, phải nhét lại vào túi
        if (!hasAnswered) {
            questionManager.skipAndReturn();
        }
        
        generateNewQuestion();
    });

    playBtn.addEventListener('click', () => {
        if (!questionManager.currentAnswer) {
            generateNewQuestion();
        } else {
            playCurrentQuestion();
        }
    });

    replayBtn.addEventListener('click', playCurrentQuestion);
    stopBtn.addEventListener('click', stopPlaying);
    
    checkBtn.addEventListener('click', submitAnswer);
    showAnswerBtn.addEventListener('click', giveUp);

    // Bấm Enter trong ô nhập liệu để kiểm tra
    answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitAnswer();
        }
    });

    // ==========================================
    // 5. HIỆU ỨNG RIPPLE CHO NÚT BẤM
    // ==========================================
    document.addEventListener('click', function(e) {
        const target = e.target.closest('.ripple');
        if (!target) return;

        const circle = document.createElement('span');
        const diameter = Math.max(target.clientWidth, target.clientHeight);
        const radius = diameter / 2;

        const rect = target.getBoundingClientRect();
        
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${e.clientX - rect.left - radius}px`;
        circle.style.top = `${e.clientY - rect.top - radius}px`;
        circle.classList.add('ripple-effect');

        // Xóa span cũ nếu có để tránh rác DOM
        const existingRipple = target.querySelector('.ripple-effect');
        if (existingRipple) {
            existingRipple.remove();
        }

        target.appendChild(circle);

        setTimeout(() => {
            circle.remove();
        }, 600);
    });
});