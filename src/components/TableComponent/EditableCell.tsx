import { Button, DatePicker, Input, InputNumber, Select } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import type { EditableCellProps } from "../../types/initialTypes";
import { CheckIcon, XIcon } from "lucide-react";
export const EditableCell: React.FC<EditableCellProps> = ({
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
      setTimeout(() => {
        setDatePickerOpen(true);
      }, 100);
    }
    if (editing && inputType === "select") {
      setTimeout(() => {
        setSelectOpen(true);
      }, 100);
    }
  }, [editing, record, dataIndex, inputType]);

  useEffect(() => {
    if (!editing) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        const target = event.target as Element;
        const isAntDropdown = target.closest?.(
          ".ant-picker-dropdown, .ant-select-dropdown",
        );

        if (isAntDropdown) {
          return;
        }

        if (inputType === "text" || inputType === "number") {
          handleSave();
        } else if (inputType === "select" || inputType === "date") {
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
                ? date.startOf("day").format("YYYY-MM-DDTHH:mm:ss")
                : null;
              setValue(isoDate);
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
