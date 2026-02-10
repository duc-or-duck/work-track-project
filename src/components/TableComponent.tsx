import { Table, Input, InputNumber, Select, Button, DatePicker } from "antd";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Trash2Icon, CheckIcon, XIcon } from "lucide-react";
import type { TableProps } from "antd";
import dayjs, { Dayjs } from "dayjs";

interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: string;
  title: string;
  inputType?: "number" | "text" | "select" | "date";
  options?: { label: string; value: string | number }[];
  record: any;
  index: number;
  children: React.ReactNode;
  onSave: (record: any) => void;
  onCancel: () => void;
}

const EditableCell: React.FC<EditableCellProps> = ({
  editing,
  dataIndex,
  inputType = "text",
  options,
  record,
  children,
  onSave,
  onCancel,
  ...restProps
}) => {
  const [value, setValue] = useState(record?.[dataIndex]);
  const [isComposing, setIsComposing] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<any>(null);

  useEffect(() => {
    if (editing && record?.[dataIndex] !== undefined) {
      setValue(record[dataIndex]);
    }
    if (editing && inputType === "date") {
      // Mở date picker khi vào chế độ edit
      setTimeout(() => {
        setDatePickerOpen(true);
      }, 100);
    }
    if (editing && inputType === "select") {
      // Mở select khi vào chế độ edit
      setTimeout(() => {
        setSelectOpen(true);
      }, 100);
    }
  }, [editing, record, dataIndex, inputType]);

  // Click outside handler
  useEffect(() => {
    if (!editing) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        // Kiểm tra xem có phải là dropdown của antd không
        const target = event.target as Element;
        const isAntDropdown = target.closest?.(
          ".ant-picker-dropdown, .ant-select-dropdown",
        );

        if (isAntDropdown) {
          return; // Không xử lý nếu click vào dropdown
        }

        // Auto-save for text/number inputs when clicking outside
        if (inputType === "text" || inputType === "number") {
          handleSave();
        } else if (inputType === "select" || inputType === "date") {
          // Đóng select/date và hủy edit
          setSelectOpen(false);
          setDatePickerOpen(false);
          setTimeout(() => {
            handleCancel();
          }, 50);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editing, value, inputType]);

  const handleSave = useCallback(() => {
    if (!record || !dataIndex) return;

    if (value === record[dataIndex]) {
      onCancel();
      return;
    }

    onSave({ ...record, [dataIndex]: value });
  }, [record, dataIndex, value, onSave, onCancel]);

  const handleCancel = useCallback(() => {
    if (record?.[dataIndex] !== undefined) {
      setValue(record[dataIndex]);
    }
    setDatePickerOpen(false);
    setSelectOpen(false);
    onCancel();
  }, [record, dataIndex, onCancel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      } else if (e.key === "Enter" && !isComposing) {
        e.preventDefault();
        handleSave();
      }
    },
    [handleCancel, handleSave, isComposing],
  );

  const renderInput = useCallback(() => {
    switch (inputType) {
      case "number":
        return (
          <InputNumber
            style={{ width: "100%" }}
            value={value}
            onChange={(val) => setValue(val)}
            onPressEnter={handleSave}
            onKeyDown={handleKeyDown}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        );

      case "select":
        return (
          <Select
            options={options || []}
            style={{ width: "100%" }}
            value={value}
            onChange={(val) => {
              setValue(val);
              // Lưu ngay khi chọn giá trị
              setTimeout(() => {
                onSave({ ...record, [dataIndex]: val });
              }, 50);
            }}
            onKeyDown={handleKeyDown}
            autoFocus
            open={selectOpen}
            onDropdownVisibleChange={(open) => {
              if (!open) {
                setTimeout(() => {
                  handleCancel();
                }, 100);
              }
            }}
            onClick={(e) => e.stopPropagation()}
          />
        );

      case "date": {
        const dateValue = value ? dayjs(value) : null;

        return (
          <DatePicker
            style={{ width: "100%" }}
            value={dateValue}
            format="DD/MM/YYYY"
            onChange={(date: Dayjs | null) => {
              const isoDate = date
                ? date.startOf("day").format("YYYY-MM-DDTHH:mm:ss") + "Z"
                : null;
              setValue(isoDate);
              // Lưu ngay khi chọn ngày
              setTimeout(() => {
                onSave({ ...record, [dataIndex]: isoDate });
              }, 50);
            }}
            onOpenChange={(open) => {
              setDatePickerOpen(open);
              if (!open) {
                setTimeout(() => {
                  handleCancel();
                }, 100);
              }
            }}
            placeholder="Chọn ngày"
            autoFocus
            open={datePickerOpen}
            ref={datePickerRef}
            onClick={(e) => e.stopPropagation()}
          />
        );
      }

      default:
        return (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onPressEnter={handleSave}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        );
    }
  }, [
    inputType,
    value,
    options,
    handleSave,
    handleKeyDown,
    record,
    dataIndex,
    onSave,
    isComposing,
    selectOpen,
    datePickerOpen,
    handleCancel,
  ]);

  return (
    <td {...restProps}>
      {editing ? (
        <div
          ref={containerRef}
          style={{ display: "flex", gap: "4px", alignItems: "center" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ flex: 1 }}>{renderInput()}</div>
          {inputType !== "select" && inputType !== "date" && (
            <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
              <Button
                type="text"
                size="small"
                icon={<CheckIcon size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                style={{
                  color: "#52c41a",
                  padding: "0 4px",
                  minWidth: "24px",
                }}
                title="Lưu (Enter)"
              />
              <Button
                type="text"
                size="small"
                icon={<XIcon size={14} />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel();
                }}
                style={{
                  color: "#ff4d4f",
                  padding: "0 4px",
                  minWidth: "24px",
                }}
                title="Hủy (Esc)"
              />
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            padding: "4px",
            minHeight: "32px",
            display: "flex",
            alignItems: "center",
          }}
        >
          {children}
        </div>
      )}
    </td>
  );
};

interface ColumnType {
  title: string;
  dataIndex: string;
  key: string;
  editable?: boolean;
  inputType?: "text" | "number" | "select" | "date";
  options?: Array<{ label: string; value: string | number }>;
  width?: number;
  fixed?: "left" | "right";
  render?: (text: any, record: any, index: number) => React.ReactNode;
  [key: string]: any;
}

interface TableComponentProps {
  data: any[];
  columns: ColumnType[];
  onSave?: (record: any) => Promise<boolean>;
  onDelete?: (record: any) => void;
  loading?: boolean;
}

export const TableComponent: React.FC<TableComponentProps> = ({
  data,
  columns,
  onSave,
  onDelete,
  loading = false,
}) => {
  const [dataSource, setDataSource] = useState<any[]>(data);
  const [editingCell, setEditingCell] = useState<{
    id: string | number;
    dataIndex: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDataSource(data);
  }, [data]);

  const isEditing = useCallback(
    (record: any, dataIndex: string): boolean => {
      return (
        editingCell?.id === record?.id && editingCell?.dataIndex === dataIndex
      );
    },
    [editingCell],
  );

  const handleEdit = useCallback(
    (record: any, dataIndex: string) => {
      if (record?.id && dataIndex && !saving) {
        setEditingCell({ id: record.id, dataIndex });
      }
    },
    [saving],
  );

  const handleCancel = useCallback(() => {
    setEditingCell(null);
    setSaving(false);
  }, []);

  const handleSave = useCallback(
    async (updatedRecord: any) => {
      if (!updatedRecord?.id || saving) return;

      setSaving(true);

      try {
        const newData = [...dataSource];
        const index = newData.findIndex((item) => item.id === updatedRecord.id);

        if (index > -1) {
          if (onSave) {
            const success = await onSave(updatedRecord);
            if (success) {
              newData.splice(index, 1, updatedRecord);
              setDataSource(newData);
              setEditingCell(null);
            }
          } else {
            newData.splice(index, 1, updatedRecord);
            setDataSource(newData);
            setEditingCell(null);
          }
        }
      } catch (error) {
        console.error("Error saving:", error);
      } finally {
        setSaving(false);
      }
    },
    [dataSource, onSave, saving],
  );

  const mergedColumns: TableProps<any>["columns"] = useMemo(
    () =>
      columns.map((col) => {
        if (!col.editable) {
          return {
            ...col,
            onCell: () => ({}),
          };
        }

        return {
          ...col,
          onCell: (record: any): any => ({
            record,
            inputType: col.inputType || "text",
            options: col.options || [],
            dataIndex: col.dataIndex,
            title: col.title,
            editing: isEditing(record, col.dataIndex),
            onSave: handleSave,
            onCancel: handleCancel,
            index: 0,
            children: null,
          }),
          render: (text: any, record: any, index: number) => {
            const editing = isEditing(record, col.dataIndex);

            if (editing) {
              return null;
            }

            const renderContent = () => {
              if (col.render && typeof col.render === "function") {
                return col.render(text, record, index);
              }

              if (col.inputType === "date" && text) {
                return dayjs(text).format("DD/MM/YYYY");
              }

              return text ?? "";
            };

            return (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(record, col.dataIndex);
                }}
                style={{
                  cursor: "pointer",
                  width: "100%",
                  minHeight: "22px",
                  padding: "4px 0",
                }}
                title="Click để chỉnh sửa"
              >
                {renderContent()}
              </div>
            );
          },
        };
      }),
    [columns, isEditing, handleSave, handleCancel, handleEdit],
  );

  const finalColumns: TableProps<any>["columns"] = useMemo(
    () => [
      ...(mergedColumns || []),
      ...(onDelete
        ? [
            {
              title: "Thao tác",
              dataIndex: "operation",
              key: "operation",
              width: 100,
              fixed: "right" as const,
              render: (_: any, record: any) => (
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <Button
                    type="link"
                    danger
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(record);
                    }}
                    style={{ padding: 0, height: "auto" }}
                    icon={<Trash2Icon size={16} />}
                    title="Xóa"
                    disabled={saving}
                  />
                </div>
              ),
            },
          ]
        : []),
    ],
    [mergedColumns, onDelete, saving],
  );

  return (
    <Table
      components={{
        body: {
          cell: EditableCell,
        },
      }}
      dataSource={dataSource}
      columns={finalColumns}
      rowKey={(record) => record.id}
      pagination={{
        pageSize: 10,
        size: "small",
        showSizeChanger: true,
        showTotal: (total: number) => `Tổng ${total} bản ghi`,
        pageSizeOptions: ["5", "10", "20", "50", "100"],
      }}
      size="small"
      scroll={{ x: 1100 }}
      bordered
      loading={loading || saving}
    />
  );
};

export default TableComponent;
