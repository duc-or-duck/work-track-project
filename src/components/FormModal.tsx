import { Form, Input, Modal, Select, Tag, DatePicker } from "antd";
import { useEffect } from "react";
import type { FormPopupProps, IColumn } from "../types/initialTypes";
import dayjs from "dayjs";

// Thêm type cho multi-select và date
type ExtendedColumn = IColumn & {
  multiple?: boolean;
  showTime?: boolean;
  format?: string;
  picker?: "date" | "week" | "month" | "quarter" | "year";
};

export const FormModal = ({
  open,
  title,
  columns,
  initialValues,
  onSubmit,
  onCancel,
  loading = false,
}: FormPopupProps) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && initialValues) {
      // Xử lý giá trị date và multi-select
      const processedValues = { ...initialValues };

      // Convert date strings to dayjs objects
      columns.forEach((column: ExtendedColumn) => {
        if (column.type === "date" && processedValues[column.key]) {
          processedValues[column.key] = dayjs(processedValues[column.key]);
        }
      });

      form.setFieldsValue(processedValues);
    } else {
      form.resetFields();
    }
  }, [open, initialValues, form, columns]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      // Convert dayjs objects back to strings
      const processedValues = { ...values };
      columns.forEach((column: ExtendedColumn) => {
        if (column.type === "date" && processedValues[column.key]) {
          processedValues[column.key] =
            processedValues[column.key].toISOString();
        }
      });

      onSubmit(processedValues);
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  // Custom tag render cho multi-select
  const tagRender = (props: any) => {
    const { label, value, closable, onClose } = props;
    const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
      event.preventDefault();
      event.stopPropagation();
    };

    return (
      <Tag
        color="blue"
        onMouseDown={onPreventMouseDown}
        closable={closable}
        onClose={onClose}
        style={{ marginRight: 3, marginBottom: 2 }}
      >
        {label}
      </Tag>
    );
  };

  const renderFormItem = (column: ExtendedColumn) => {
    switch (column.type) {
      case "select":
        if (column.multiple) {
          return (
            <Select
              mode="multiple"
              tagRender={tagRender}
              placeholder={`Chọn ${column.label.toLowerCase()}`}
              options={column.options}
              disabled={column.disabled}
              size="large"
              style={{ width: "100%" }}
              maxTagCount="responsive"
              maxTagTextLength={10}
              listHeight={250}
              showSearch={{
                filterOption: (input, option) =>
                  String(option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase()),
              }}
              allowClear
              popupMatchSelectWidth={true}
            />
          );
        }
        return (
          <Select
            placeholder={`Chọn ${column.label.toLowerCase()}`}
            options={column.options}
            disabled={column.disabled}
            size="large"
            style={{ width: "100%" }}
            allowClear
          />
        );

      case "date":
        return (
          <DatePicker
            placeholder={`Chọn ${column.label.toLowerCase()}`}
            disabled={column.disabled}
            size="large"
            style={{ width: "100%" }}
            format={column.format || "DD/MM/YYYY"}
            picker={column.picker || "date"}
            showTime={column.showTime}
            allowClear
          />
        );

      case "dateRange":
        return (
          <DatePicker.RangePicker
            placeholder={["Từ ngày", "Đến ngày"]}
            disabled={column.disabled}
            size="large"
            style={{ width: "100%" }}
            format={column.format || "DD/MM/YYYY"}
            showTime={column.showTime}
            allowClear
          />
        );

      case "textarea":
        return (
          <Input.TextArea
            rows={4}
            placeholder={`Nhập ${column.label.toLowerCase()}`}
            disabled={column.disabled}
            size="large"
            style={{ resize: "none" }}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            placeholder={`Nhập ${column.label.toLowerCase()}`}
            disabled={column.disabled}
            size="large"
          />
        );

      default:
        return (
          <Input
            placeholder={`Nhập ${column.label.toLowerCase()}`}
            disabled={column.disabled}
            size="large"
          />
        );
    }
  };

  // Validation rules
  const getRules = (column: ExtendedColumn) => {
    const baseRules = [
      {
        required: column.required,
        message: `Vui lòng ${
          column.type === "select" ||
          column.type === "date" ||
          column.type === "dateRange"
            ? "chọn"
            : "nhập"
        } ${column.label.toLowerCase()}`,
      },
    ];

    // Validation cho multi-select
    if (column.type === "select" && column.multiple && column.required) {
      return [
        ...baseRules,
        {
          validator: (_: any, value: string[]) => {
            if (!value || value.length === 0) {
              return Promise.reject(
                new Error(
                  `Vui lòng chọn ít nhất một ${column.label.toLowerCase()}`,
                ),
              );
            }
            return Promise.resolve();
          },
        },
      ];
    }

    return baseRules;
  };

  return (
    <Modal
      title={title}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Xác nhận"
      cancelText="Hủy"
      width={560}
      centered
      destroyOnClose
      styles={{
        header: {
          paddingBottom: 16,
          marginBottom: 24,
          borderBottom: "1px solid #f0f0f0",
        },
        body: {
          paddingTop: 0,
          maxHeight: "calc(100vh - 300px)",
          overflowY: "auto",
        },
        footer: {
          paddingTop: 24,
          borderTop: "1px solid #f0f0f0",
        },
      }}
      okButtonProps={{
        size: "large",
        style: { minWidth: 100, height: 40 },
      }}
      cancelButtonProps={{
        size: "large",
        style: { minWidth: 100, height: 40 },
      }}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        variant="underlined"
        style={{ marginTop: 8 }}
        initialValues={initialValues}
      >
        {columns.map((column: ExtendedColumn) => (
          <Form.Item
            key={column.key}
            name={column.key}
            label={
              <span style={{ fontSize: 14, fontWeight: 500, color: "#262626" }}>
                {column.label}
                {column.required && (
                  <span style={{ color: "#ff4d4f", marginLeft: 4 }}>*</span>
                )}
              </span>
            }
            rules={getRules(column)}
            style={{ marginBottom: 20 }}
            // Normalize cho multi-select và date
            normalize={(value) => {
              if (column.type === "select" && column.multiple) {
                return Array.isArray(value) ? value : [];
              }
              return value;
            }}
          >
            {renderFormItem(column)}
          </Form.Item>
        ))}
      </Form>
    </Modal>
  );
};
