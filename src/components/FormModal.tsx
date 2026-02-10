import { Form, Input, Modal, Select, Tag, Space } from "antd";
import { useEffect } from "react";
import type { Column, FormPopupProps } from "../types/initialTypes";

// Thêm type cho multi-select
type ExtendedColumn = Column & {
  multiple?: boolean;
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
      // Xử lý giá trị multi-select nếu có
      const processedValues = { ...initialValues };
      form.setFieldsValue(processedValues);
    } else {
      form.resetFields();
    }
  }, [open, initialValues, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
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
              showArrow
              tagRender={tagRender}
              placeholder={`Chọn ${column.label.toLowerCase()}`}
              options={column.options}
              disabled={column.disabled}
              size="large"
              style={{ width: "100%" }}
              maxTagCount="responsive"
              maxTagTextLength={10}
              dropdownStyle={{ maxHeight: 250 }}
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              // Thêm clear icon và dropdownMatchSelectWidth
              allowClear
              dropdownMatchSelectWidth={true}
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

  // Validation rules cho multi-select
  const getRules = (column: ExtendedColumn) => {
    const baseRules = [
      {
        required: column.required,
        message: `Vui lòng ${column.type === "select" ? "chọn" : "nhập"} ${column.label.toLowerCase()}`,
      },
    ];

    // Thêm validation đặc biệt cho multi-select
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
            // Thêm normalize cho multi-select để đảm bảo luôn là array
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
