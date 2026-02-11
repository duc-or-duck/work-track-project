import { Table, Input, InputNumber, Select, Button, DatePicker } from "antd";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Trash2Icon, CheckIcon, XIcon } from "lucide-react";
import type { TableProps } from "antd";
import dayjs, { Dayjs } from "dayjs";
import type { TableComponentProps } from "../../types/initialTypes";
import { EditableCell } from "./EditableCell";

export const TableComponent: React.FC<TableComponentProps> = ({
  data,
  columns,
  onSave,
  onDelete,
  loading = false,
  expandable,
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
      expandable={expandable}
    />
  );
};

export default TableComponent;
