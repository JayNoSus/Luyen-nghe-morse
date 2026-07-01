/**
 * Dữ liệu: Khẩu lệnh trại và sinh hoạt (Chế độ 3)
 * Khoảng 250+ câu lệnh viết bằng Tiếng Việt có dấu.
 */
const DATA_COMMANDS = [
    // Tập hợp cơ bản
    "tập hợp", "xếp hàng", "dừng lại", "ngồi xuống", "tất cả đứng dậy", 
    "về đội hình", "chuẩn bị", "tiến lên", "lùi lại", "giải tán", "nghiêm", 
    "nghỉ", "chào", "thôi", "đằng trước thẳng", "đằng sau thẳng",
    
    // Đội hình đội ngũ
    "tập hợp hàng dọc", "tập hợp hàng ngang", "tập hợp hình chữ u", 
    "tập hợp hình vòng tròn", "tập hợp hình bán nguyệt", "cự ly rộng", 
    "cự ly hẹp", "chỉnh đốn đội ngũ", "nhìn trước thẳng", "nhìn phải thẳng", 
    "nhìn trái thẳng", "bên phải quay", "bên trái quay", "đằng sau quay", 
    "nửa vòng bên phải quay", "nửa vòng bên trái quay",
    
    // Di chuyển
    "bước đều bước", "chạy đều chạy", "đứng lại đứng", "vòng bên phải bước", 
    "vòng bên trái bước", "chạy tại chỗ", "tiến một bước", "lùi một bước", 
    "sang phải một bước", "sang trái một bước", "bước sang ngang",
    
    // Điểm số & Báo cáo
    "điểm số", "từ một đến hết điểm số", "điểm số báo cáo", "báo cáo sĩ số", 
    "đội trưởng báo cáo", "các đội chú ý", "các đội trưởng lên nhận lệnh", 
    "lắng nghe lệnh", "báo cáo hoàn tất", "xin phép còi", "xin phép phát biểu",
    
    // Sinh hoạt & Trò chơi
    "chuẩn bị trò chơi", "bắt đầu", "kết thúc", "dừng tay", "tiếp tục", 
    "nhanh chóng lên", "khẩn trương", "chậm lại", "giữ trật tự", "im lặng", 
    "chú ý lắng nghe", "quay lên", "quay xuống", "nhắm mắt lại", "mở mắt ra", 
    "nắm tay nhau", "buông tay ra", "khoanh tay lại", "chuẩn bị băng reo", 
    "hát to lên", "hát đều", "hô khẩu hiệu", "múa theo tôi",
    
    // Lửa trại & Đời sống
    "chuẩn bị củi lửa", "gọi lửa", "châm lửa", "nhảy lửa", "tàn lửa", 
    "giải lao", "ăn nhẹ", "uống nước", "đi vệ sinh", "thu dọn", "dọn dẹp", 
    "vệ sinh khu vực", "nhặt rác", "tắt lửa", "kiểm tra lều", "điểm danh tối", 
    "chuẩn bị đi ngủ", "thức dậy", "tập thể dục buổi sáng",
    
    // Khẩu lệnh Phụng vụ
    "chuẩn bị thánh lễ", "xếp hàng rước", "tiến vào nhà thờ", "ra khỏi nhà thờ", 
    "quỳ xuống", "đứng lên", "ngồi ngay ngắn", "chắp tay lại", "đọc kinh", 
    "không nói chuyện", "tôn trọng không gian thánh", "giữ im lặng tuyệt đối",
    
    // Khen thưởng & Kỷ luật
    "tuyên dương", "trao phần thưởng", "cộng điểm", "trừ điểm", "cảnh cáo", 
    "phạt kỷ luật", "kiểm điểm", "xin lỗi đội", "cảm ơn ban tổ chức", 
    "thực hành ngay", "quay về vị trí", "tập trung cao độ", "cố gắng lên", 
    "tuyệt vời", "làm lại", "sai rồi", "rất tốt"
];