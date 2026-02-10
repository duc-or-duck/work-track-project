import { Grid } from "lucide-react";
import { Button, Input, Select } from "antd";
import React from "react";

export interface EmployeeFilterValues {
  full_name?: string;
  position?: string;
  department?: string;
  status?: string;
}

interface FilterProps {
  onSubmit?: (values: EmployeeFilterValues) => void;
}

export const FilterEmployee = ({ onSubmit }: FilterProps) => {
  const [filters, setFilters] = React.useState<EmployeeFilterValues>({});

  const handleChange = (key: keyof EmployeeFilterValues, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = () => {
    onSubmit?.(filters);
  };

  const handleReset = () => {
    setFilters({});
    onSubmit?.({});
  };

  return (
    <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Grid size={18} />
        Bộ lọc nhân viên
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Input
          placeholder="Họ tên"
          value={filters.full_name}
          onChange={(e) => handleChange("full_name", e.target.value)}
        />
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button onClick={handleReset}>Reset</Button>
        <Button type="primary" onClick={handleSubmit}>
          Lọc
        </Button>
      </div>
    </div>
  );
};
