
export const formColumns: any[] = [
  {
    key: "name",
    label: "Tên dự án",
    type: "text",
    required: true,
  },
  {
    key: "start_date",
    label: "Ngày bắt đầu",
    type: "date",
    required: true,
  },
  {
    key: "end_date",
    label: "Ngày kết thúc",
    type: "date",
    required: true,
  },
  {
    key: "description",
    label: "Mô tả",
    type: "textarea",
    required: false,
  },
  {
    key: "status",
    label: "Trạng thái",
    type: "select",
    required: true,
    options: [
      { label: "Planning", value: "Planning" },
      { label: "Processing", value: "Processing" },
      { label: "Completed", value: "Completed" },
      { label: "Cancelled", value: "Cancelled" },
    ],
  },
  {
    key: "priority",
    label: "Độ ưu tiên",
    type: "select",
    required: true,
    options: [
      { label: "Thấp", value: 3 },
      { label: "Trung bình", value: 2 },
      { label: "Cao", value: 1 },
    ],
  },
];

