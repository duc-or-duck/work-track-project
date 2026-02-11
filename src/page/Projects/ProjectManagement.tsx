import { useEffect, useState } from "react";
import type { IProject, ITableType } from "../../types/initialTypes";
import apiService from "../../Services/ApiService";
import { Button, Tag, message } from "antd";
import { Plus } from "lucide-react";
import { FormModal } from "../../components/FormModal";
import { ConfirmModal } from "../../components/ConfirmModal";
import { useNavigate } from "react-router-dom";
import { TableComponent } from "../../components/TableComponent/TableComponent";
import {
  calculateDaysBetween,
  calculateOverdueDays,
  formatDateSafe,
  validateDates,
} from "../../utils/formatDate";
import { formColumns } from "./ProjectColumn";

export const ProjectManagement = () => {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalConfirmOpen, setIsModalConfirmOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<IProject | null>(null);
  const [modalType, setModalType] = useState<ITableType>();
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const getListProject = async () => {
    setLoading(true);
    const response = await apiService.get("/Project");
    if (response.succeeded) {
      const projectData = response?.data;
      console.log("Projects loaded:", projectData);
      setProjects(projectData);
    }
    setLoading(false);
  };

  useEffect(() => {
    getListProject();
  }, []);
  const handleTableAction = async (record?: IProject, type?: ITableType) => {
    setModalType(type || null);
    if (record) setSelectedProject(record);
    setIsModalOpen(true);
  };
  const formatProjectData = (
    values: Partial<IProject>,
    mode: "add" | "update" | "delete",
  ): any => {
    const base = {
      is_active: mode === "delete" ? false : (values.is_active ?? true),
      is_deleted: mode === "delete",
      name: values.name || "",
      description: values.description || "",
      // Sử dụng hàm format an toàn
      start_date: formatDateSafe(
        values.start_date ?? undefined,
        selectedProject?.start_date || new Date().toISOString(),
      ),
      end_date: formatDateSafe(
        values.end_date ?? undefined,
        selectedProject?.end_date || new Date().toISOString(),
      ),
      status: values.status || "Planning",
      priority: values.priority ?? 3,
    };

    if (mode === "update" || mode === "delete") {
      return { ...base, id: values.id || selectedProject?.id };
    }
    return base;
  };

  const handleSubmit = async (values?: Partial<IProject>, isDelete = false) => {
    // Validate dates trước khi submit
    if (!isDelete && values) {
      const startDate = values.start_date || selectedProject?.start_date;
      const endDate = values.end_date || selectedProject?.end_date;

      if (startDate && endDate && !validateDates(startDate, endDate)) {
        message.error("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu!");
        return;
      }
    }

    let payload: any;
    let successMessage = "";

    if (isDelete) {
      payload = formatProjectData(selectedProject || {}, "delete");
      successMessage = "Xóa dự án thành công";
    } else if (modalType === "add") {
      payload = formatProjectData(values || {}, "add");
      successMessage = "Thêm dự án thành công";
    } else {
      payload = formatProjectData(
        {
          ...selectedProject,
          ...values,
        },
        "update",
      );
      successMessage = "Cập nhật dự án thành công";
    }

    const response = await apiService.post("/Project", payload);

    if (response?.succeeded) {
      message.success(successMessage);
      setIsModalOpen(false);
      setIsModalConfirmOpen(false);
      await getListProject();
    } else {
      message.error(response?.message || "Có lỗi xảy ra");
    }
  };

  const handleTableSave = async (record: IProject): Promise<boolean> => {
    const original = projects.find((p) => p.id === record.id);
    if (!original) {
      message.error("Không tìm thấy dự án");
      return false;
    }

    // Validate dates
    if (!validateDates(record.start_date ?? null, record.end_date ?? null)) {
      message.error("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu!");
      return false;
    }
    const hasChanges = [
      "name",
      "description",
      "start_date",
      "end_date",
      "status",
      "priority",
    ].some((key) => {
      const origVal = original[key as keyof IProject];
      const newVal = record[key as keyof IProject];

      if (key === "priority") {
        return Number(origVal) !== Number(newVal);
      }
      if (key === "status") {
        return String(origVal).trim() !== String(newVal).trim();
      }
      if (key === "start_date" || key === "end_date") {
        const origDate = origVal
          ? new Date(origVal as string).toISOString()
          : null;
        const newDate = newVal
          ? new Date(newVal as string).toISOString()
          : null;
        return origDate !== newDate;
      }

      return origVal !== newVal;
    });

    if (!hasChanges) {
      console.log("No changes detected");
      return true;
    }
    const payload = formatProjectData({ ...original, ...record }, "update");

    const response = await apiService.post("/Project", payload);

    if (response?.succeeded) {
      message.success("Cập nhật thành công");
      await getListProject();
      return true;
    }

    message.error(response?.message || "Cập nhật thất bại");
    return false;
  };

  const handleTableDelete = (record: IProject) => {
    setSelectedProject(record);
    setIsModalConfirmOpen(true);
  };

  // Cấu hình columns cho TableComponent
  const tableColumns = [
    {
      title: "Tên dự án",
      dataIndex: "name",
      key: "name",
      editable: true,
      inputType: "text" as const,
      width: 200,
    },
    {
      title: "Ngày bắt đầu",
      dataIndex: "start_date",
      key: "start_date",
      editable: true,
      inputType: "date" as const,
      width: 150,
      render: (value: string) =>
        value ? new Date(value).toLocaleDateString("vi-VN") : "-",
    },
    {
      title: "Ngày kết thúc",
      dataIndex: "end_date",
      key: "end_date",
      editable: true,
      inputType: "date" as const,
      width: 150,
      render: (value: string) =>
        value ? new Date(value).toLocaleDateString("vi-VN") : "-",
    },
    {
      title: "Số ngày",
      dataIndex: "duration",
      key: "duration",
      editable: false,
      width: 100,
      render: (_: any, record: IProject) => {
        const days = calculateDaysBetween(
          record.start_date || "",
          record.end_date || "",
        );
        return (
          <span
            style={{
              fontWeight: 500,
              color: days > 0 ? "#1890ff" : "#999",
              textAlign: "center",
              display: "block",
            }}
          >
            {days > 0 ? `${days} ngày` : "-"}
          </span>
        );
      },
    },
    {
      title: "Trễ hạn",
      dataIndex: "description",
      key: "description",
      editable: false,
      width: 100,
      render: (_: any, record: IProject) => {
        const isProcessing = record?.status === "Processing";

        // 2. Chỉ tính số ngày nếu chưa hoàn thành
        const days = isProcessing ? calculateOverdueDays(record?.end_date) : 0;

        return (
          <span
            style={{
              fontWeight: 500,
              // Màu đỏ (#ff4d4f) thường dùng cho trễ hạn để gây chú ý hơn màu xanh
              color: days > 0 ? "#ff4d4f" : "#999",
              textAlign: "center",
              display: "block",
            }}
          >
            {days > 0 ? `${days} ngày` : "-"}
          </span>
        );
      },
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      editable: true,
      inputType: "text" as const,
      width: 250,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      editable: true,
      inputType: "select" as const,
      width: 150,
      options: [
        { label: "Planning", value: "Planning" },
        { label: "Processing", value: "Processing" },
        { label: "Completed", value: "Completed" },
        { label: "Cancelled", value: "Cancelled" },
      ],
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          Planning: "default",
          Processing: "processing",
          Completed: "success",
          Cancelled: "error",
        };
        return <Tag color={colorMap[status] || "default"}>{status}</Tag>;
      },
    },
    {
      title: "Ưu tiên",
      dataIndex: "priority",
      key: "priority",
      editable: true,
      inputType: "select" as const,
      width: 120,
      options: [
        { label: "Thấp", value: 3 },
        { label: "Trung bình", value: 2 },
        { label: "Cao", value: 1 },
      ],
      render: (value: number) => {
        const priorityMap: Record<number, string> = {
          1: "Cao",
          2: "Trung bình",
          3: "Thấp",
        };
        return priorityMap[value] || "Thấp";
      },
    },
    {
      title: "Chi tiết",
      dataIndex: "detail",
      key: "detail",
      editable: false,
      width: 100,
      fixed: "right" as const,
      render: (_: any, record: IProject) => (
        <Button
          type="link"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/project/${record.id}`);
          }}
          style={{ padding: 0 }}
        >
          Xem chi tiết
        </Button>
      ),
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
        <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 600 }}>
          Quản lý dự án
        </h2>
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
            gap: "8px",
            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          onClick={() => handleTableAction(undefined, "add")}
        >
          <Plus size={18} />
          Thêm dự án
        </Button>
      </div>

      <TableComponent
        data={projects}
        columns={tableColumns}
        onSave={handleTableSave}
        onDelete={handleTableDelete}
        loading={loading}
      />

      {isModalOpen && (
        <FormModal
          open={isModalOpen}
          title={modalType === "add" ? "Thêm dự án" : "Cập nhật dự án"}
          columns={formColumns}
          initialValues={selectedProject}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedProject(null);
          }}
        />
      )}

      {isModalConfirmOpen && (
        <ConfirmModal
          title="Xóa dự án"
          content={`Bạn chắc chắn muốn xóa dự án "${selectedProject?.name}"?`}
          columns={[]}
          open={isModalConfirmOpen}
          onSubmit={() => handleSubmit(undefined, true)}
          onCancel={() => {
            setIsModalConfirmOpen(false);
            setSelectedProject(null);
          }}
        />
      )}
    </div>
  );
};
