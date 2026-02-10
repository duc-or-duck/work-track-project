export const formatDateSafe = (
  dateStr: string | null | undefined,
  defaultDate: string,
): string => {
  if (!dateStr) return defaultDate;
  
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return defaultDate;
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    
    return `${year}-${month}-${day}T00:00:00Z`;
  } catch {
    return defaultDate;
  }
};

/**
 * Tính số ngày giữa hai ngày
 */
export const calculateDaysBetween = (
  startDate: string | null | undefined,
  endDate: string | null | undefined,
): number => {
  if (!startDate || !endDate) return 0;

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return diffDays > 0 ? diffDays : 0;
  } catch {
    return 0;
  }
};

export const calculateOverdueDays = (
  dueDate: string | null | undefined,
): number => {
  if (!dueDate) return 0;

  try {
    const today = new Date();
    const deadline = new Date(dueDate);
    
    // Kiểm tra định dạng ngày hợp lệ
    if (isNaN(deadline.getTime())) return 0;

    // Reset giờ về 00:00:00 để so sánh chính xác theo ngày
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - deadline.getTime();
    
    // Chuyển đổi mili giây sang ngày
    // Sử dụng Math.floor vì chúng ta muốn lấy số ngày tròn đã trôi qua
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Nếu diffDays > 0 nghĩa là đã qua ngày hết hạn
    return diffDays > 0 ? diffDays : 0;
  } catch {
    return 0;
  }
};

/**
 * Validate ngày: ngày kết thúc phải >= ngày bắt đầu
 */
export const validateDates = (
  startDate: string | null | undefined,
  endDate: string | null | undefined,
): boolean => {
  if (!startDate || !endDate) return true;
  
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return true;
    
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    return end >= start;
  } catch {
    return true;
  }
};

/**
 * Format ngày hiển thị theo định dạng Việt Nam
 */
export const formatDisplayDate = (
  date: string | null | undefined,
  fallback: string = "-"
): string => {
  if (!date) return fallback;
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return fallback;
    
    return d.toLocaleDateString("vi-VN");
  } catch {
    return fallback;
  }
};