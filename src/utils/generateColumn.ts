// Hàm tạo columns từ object bất kỳ
export const generateColumns = (data: Record<string, undefined>) => {
  return Object.keys(data).map((key) => ({
    title: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), // format tên hiển thị
    dataIndex: key,
    key: key,
  }));
};

