export function getAuthErrorMessage(errorCode: string, defaultMessage?: string): string {
  switch (errorCode) {
    case 'auth/wrong-password':
      return 'Mật khẩu không chính xác. Thầy/Cô vui lòng kiểm tra lại.';
    case 'auth/invalid-credential':
      return 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.';
    case 'auth/user-not-found':
      return 'Không tìm thấy tài khoản với email này trong hệ thống.';
    case 'auth/invalid-email':
      return 'Địa chỉ email không đúng định dạng chuẩn (ví dụ: gvcn@thpt.edu.vn).';
    case 'auth/network-request-failed':
      return 'Lỗi kết nối mạng đến máy chủ Firebase. Vui lòng kiểm tra đường truyền Internet.';
    case 'auth/too-many-requests':
      return 'Tài khoản tạm thời bị giới hạn do đăng nhập sai nhiều lần. Vui lòng thử lại sau ít phút hoặc khôi phục mật khẩu.';
    case 'auth/user-disabled':
      return 'Tài khoản Giáo viên này đã bị vô hiệu hóa trong hệ thống.';
    case 'auth/email-already-in-use':
      return 'Địa chỉ email này đã được đăng ký. Vui lòng chuyển sang tab Đăng nhập.';
    case 'auth/weak-password':
      return 'Mật khẩu quá ngắn hoặc quá yếu. Vui lòng nhập mật khẩu có tối thiểu 6 ký tự.';
    case 'auth/popup-closed-by-user':
      return 'Cửa sổ xác thực đăng nhập Google đã bị đóng trước khi hoàn tất.';
    case 'auth/popup-blocked':
      return 'Trình duyệt đã chặn cửa sổ bật lên (popup). Vui lòng cho phép popup để đăng nhập.';
    case 'auth/unauthorized-role':
      return 'Tài khoản này không có quyền Giáo viên Chủ nhiệm. Chỉ GVCN mới được phép truy cập.';
    default:
      return defaultMessage || 'Đã xảy ra lỗi trong quá trình xác thực. Vui lòng thử lại.';
  }
}
