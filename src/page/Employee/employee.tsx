import { useEffect, useState } from "react";
import apiService from "../../Services/ApiService";
import type { IEmployee, ITableType } from "../../types/initialTypes";
import { Button } from "antd";
import { Edit2Icon, Plus, Trash2Icon } from "lucide-react";
import { FormModal } from "../../components/FormModal";
import { ConfirmModal } from "../../components/ConfirmModal";
import { TableComponent } from "../../components/TableComponent";

export default function EmployeeManager() {
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalConfirmOpen, setIsModalConfirmOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<IEmployee | null>(
    null,
  );
  const [modalType, setModalType] = useState<ITableType>();

  const getListEmployee = async () => {
    const response = await apiService.get("/Employee");
    console.log(response);
    if (response.succeeded) {
      const employeeData = response?.data;
      setEmployees(employeeData);
    }
  };

  const handleTableAction = async (record?: IEmployee, type?: ITableType) => {
    setModalType(type || null);
    if (record) setSelectedEmployee(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (record?: IEmployee) => {
    if (record) setSelectedEmployee(record);
    console.log(record);
    setIsModalConfirmOpen(true);
  };

  const handleSubmit = async (values?: IEmployee, isDelete = false) => {
    let response;

    if (isDelete) {
      response = await apiService.post("/Employee/upsert", {
        is_deleted: true,
        ...selectedEmployee,
      });
      console.log(selectedEmployee?.full_name);
    } else if (modalType === "add") {
      response = await apiService.post("/Employee/upsert", values);
    } else {
      response = await apiService.post("/Employee/upsert", {
        ...values,
        id: selectedEmployee?.id,
      });
    }

    if (response?.succeeded) {
      setIsModalOpen(false);
      setIsModalConfirmOpen(false);
      getListEmployee();
    }
  };

  // Hàm xử lý lưu khi edit inline
  const handleSaveInline = async (updatedRecord: IEmployee) => {
    const response = await apiService.post("/Employee/upsert", updatedRecord);

    if (response?.succeeded) {
      getListEmployee(); // Refresh lại data
      return true;
    }
    return false;
  };

  useEffect(() => {
    getListEmployee();
  }, []);

  const formColumns: any[] = [
    {
      key: "full_name",
      label: "Họ tên",
      type: "text",
      required: true,
    },
    {
      key: "position",
      label: "Vị trí",
      type: "select",
      required: true,
      options: [
        { label: "BE", value: "BE" },
        { label: "WEB", value: "WEB" },
        { label: "MOBILE", value: "MOBILE" },
        { label: "C#", value: "C#" },
      ],
    },
    {
      key: "department",
      label: "Phòng ban",
      type: "text",
      required: true,
    },
    {
      key: "status",
      label: "Trạng thái",
      type: "select",
      required: true,
      options: [
        { label: "Waiting", value: "waiting" },
        { label: "Pending", value: "pending" },
      ],
    },
  ];

  const columns = [
    {
      title: "Full Name",
      dataIndex: "full_name",
      key: "full_name",
      editable: true, // Cho phép chỉnh sửa
      inputType: "text",
    },
    {
      title: "Position",
      dataIndex: "position",
      key: "position",
      editable: true,
      inputType: "select", // Dùng select cho position
      options: [
        { label: "BE", value: "BE" },
        { label: "WEB", value: "WEB" },
        { label: "MOBILE", value: "MOBILE" },
        { label: "C#", value: "C#" },
      ],
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      editable: true,
      inputType: "text",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      editable: true,
      inputType: "select",
      options: [
        { label: "Waiting", value: "waiting" },
        { label: "Pending", value: "pending" },
      ],
    },
  ];

  return (
    <div className="p-[24px]">
      <div
        className="flex flex-row"
        style={{
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <p>Quản lý nhân viên</p>
        <Button
          style={{
            height: "38px",
            padding: "0 24px",
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            border: "none",
            borderRadius: "10px",
            color: "#ffffff",
            fontWeight: "600",
            fontSize: "14px",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          onClick={() => handleTableAction(undefined, "add")}
        >
          Thêm nhân viên
          <Plus size={18} className="icon-plus" />
        </Button>
      </div>

      <TableComponent
        data={employees}
        columns={columns}
        onSave={handleSaveInline} // Truyền callback để lưu
        onDelete={handleDelete} // Truyền callback để xóa
      />

      {isModalOpen && (
        <FormModal
          open={isModalOpen}
          title={modalType === "add" ? "Thêm nhân viên" : "Cập nhật nhân viên"}
          columns={formColumns}
          initialValues={selectedEmployee}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      )}

      {isModalConfirmOpen && (
        <ConfirmModal
          title="Xóa nhân viên"
          content="Bạn chắc chắn muốn xóa nhân viên này ?"
          columns={[]}
          open={isModalConfirmOpen}
          onSubmit={() => handleSubmit(undefined, true)}
          onCancel={() => setIsModalConfirmOpen(false)}
        />
      )}
    </div>
  );
}
