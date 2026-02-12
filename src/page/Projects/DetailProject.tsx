import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Tag,
  Typography,
  Spin,
  Empty,
  message,
  Button,
  Avatar,
  Tooltip,
} from "antd";
import { PlusOutlined, UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

// Services & Helpers
import apiService from "../../Services/ApiService";
import { getPriorityColor, getStatusColor } from "../../Helper/Helpers";

// Components & Types
import { TableComponent } from "../../components/TableComponent/TableComponent";
import { FormModal } from "../../components/FormModal";
import type {
  IProject,
  ITask,
  IModule,
  ITaskMember,
} from "../../types/initialTypes";

const { Title } = Typography;

const TASK_STATUS_OPTIONS = [
  { label: "Chờ xử lý", value: "PENDING" },
  { label: "Đang xử lý", value: "PROCESSING" },
  { label: "Hoàn thành", value: "COMPLETED" },
  { label: "Đã hủy", value: "CANCELLED" },
  { label: "Mở", value: "OPEN" },
];

const PRIORITY_OPTIONS = [
  { label: "Thấp", value: 0 },
  { label: "Trung bình", value: 1 },
  { label: "Cao", value: 2 },
];

export const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();

  const [project, setProject] = useState<IProject | null>(null);
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalLoading, setTaskModalLoading] = useState(false);

  // ----- Lấy chi tiết dự án + tasks + modules + members -----
  const fetchProjectDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      // 🔁 Đúng endpoint theo mẫu: /work-track/Project/detail?Id=id
      const response = await apiService.get("/Project/detail", {
        Id: id,
      });
      if (response?.succeeded && response.data?.length > 0) {
        const projectData = response.data[0];
        setProject(projectData);
        setTasks(projectData.tasks || []);
      } else {
        setError(response?.message || "Không thể tải thông tin dự án");
      }
    } catch (err: any) {
      console.error("Fetch project error:", err);
      setError("Lỗi khi tải dữ liệu dự án");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProjectDetail();
  }, [fetchProjectDetail]);

  // ----- Thêm task (giữ nguyên endpoint cũ) -----
  const handleAddTask = useCallback(
    async (values: any) => {
      if (!id) return;
      setTaskModalLoading(true);
      try {
        let percent = 0;
        if (values.percent_complete != null && values.percent_complete !== "") {
          const parsed = Number(values.percent_complete);
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
            percent = Math.floor(parsed);
          }
        }

        const payload = {
          project_id: id,
          module: values.module,
          name: values.name,
          description: values.description || "",
          priority: values.priority,
          status: values.status,
          percent_complete: percent,
          start_date: values.start_date
            ? dayjs(values.start_date).toISOString()
            : dayjs().toISOString(),
          expected_end_date: values.expected_end_date
            ? dayjs(values.expected_end_date).toISOString()
            : null,
          employee_end_date: null,
          actual_end_date: null,
          is_active: true,
          is_deleted: false,
        };

        const response = await apiService.post("/project/Task", payload);
        if (response?.succeeded) {
          message.success("Thêm công việc thành công");
          setIsTaskModalOpen(false);
          fetchProjectDetail();
        } else {
          message.error(response?.message || "Thêm công việc thất bại");
        }
      } catch (err: any) {
        console.error("Add task error:", err);
        message.error(err.message || "Lỗi khi thêm công việc");
      } finally {
        setTaskModalLoading(false);
      }
    },
    [id, fetchProjectDetail],
  );

  // ----- Cập nhật task -----
  const handleUpdateTask = useCallback(
    async (record: ITask): Promise<boolean> => {
      try {
        const response = await apiService.put(
          `/project/Task/${record.id}`,
          record,
        );
        if (response?.succeeded) {
          message.success("Cập nhật công việc thành công");
          await fetchProjectDetail();
          return true;
        }
        message.error(response?.message || "Cập nhật thất bại");
        return false;
      } catch (err: any) {
        console.error("Update task error:", err);
        message.error(err.message || "Lỗi khi cập nhật công việc");
        return false;
      }
    },
    [fetchProjectDetail],
  );

  // ----- Xoá task (soft delete) -----
  const handleDeleteTask = useCallback(
    async (record: ITask): Promise<boolean> => {
      try {
        const response = await apiService.put(`/project/Task/${record.id}`, {
          is_deleted: true,
        });
        if (response?.succeeded) {
          message.success("Xoá công việc thành công");
          await fetchProjectDetail();
          return true;
        }
        message.error(response?.message || "Xoá thất bại");
        return false;
      } catch (err: any) {
        console.error("Delete task error:", err);
        message.error(err.message || "Lỗi khi xoá công việc");
        return false;
      }
    },
    [fetchProjectDetail],
  );

  // ----- Render danh sách thành viên (task_member) -----
  // 🎯 Đã sửa để đúng với cấu trúc: mỗi member có full_name và position
  const renderTaskMembers = (members: ITaskMember[] = []) => {
    if (!members || members.length === 0) return "-";
    const names = members.map((m) => m.full_name || "N/A").join(", ");
    const positions = members
      .map((m) => m.position?.name)
      .filter(Boolean)
      .join(", ");
    const tooltipTitle = positions ? `${names} (${positions})` : names;
    return (
      <Tooltip title={tooltipTitle}>
        <span>
          <Avatar.Group maxCount={2} size="small">
            {members.map((m) => (
              <Avatar
                key={m.id}
                size="small"
                icon={<UserOutlined />}
                // Không có avatar trong sample, dùng chữ cái đầu của full_name
              >
                {m.full_name?.[0] || "U"}
              </Avatar>
            ))}
          </Avatar.Group>
          <span style={{ marginLeft: 8 }}>{members.length} thành viên</span>
        </span>
      </Tooltip>
    );
  };

  // ----- Cấu hình cột cho bảng tasks -----
  const taskColumns = [
    {
      title: "Phân hệ",
      dataIndex: "module",
      key: "module",
      width: 150,
      render: (_: any, record: ITask) => {
        const module = record.module;
        if (!module) return "-";
        if (typeof module === "object" && module !== null) {
          return module.name || module.id || "-";
        }
        return String(module);
      },
    },
    {
      title: "Đầu việc",
      dataIndex: "name",
      key: "name",
      editable: true,
      inputType: "text" as const,
      render: (text: string) => <Tag color="geekblue">{text}</Tag>,
    },
    {
      title: "Tiến độ",
      dataIndex: "percent_complete",
      key: "percent_complete",
      width: 100,
      editable: true,
      inputType: "number" as const,
      render: (p: number) => <Tag color="geekblue">{p ?? 0}%</Tag>,
    },
    {
      title: "Hạn chót",
      dataIndex: "expected_end_date",
      key: "expected_end_date",
      editable: true,
      inputType: "date" as const,
      render: (date: string) => (date ? dayjs(date).format("DD/MM/YYYY") : "-"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      editable: true,
      inputType: "select" as const,
      options: TASK_STATUS_OPTIONS,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: "Ưu tiên",
      dataIndex: "priority",
      key: "priority",
      editable: true,
      inputType: "select" as const,
      options: PRIORITY_OPTIONS,
      render: (priority: number) => (
        <Tag color={getPriorityColor(priority)}>
          {PRIORITY_OPTIONS.find((opt) => opt.value === priority)?.label ||
            priority}
        </Tag>
      ),
    },
    {
      title: "Thành viên",
      dataIndex: "task_member",
      key: "task_member",
      width: 150,
      render: (members: ITaskMember[]) => renderTaskMembers(members),
    },
  ];

  // ----- Cấu hình form thêm task (lấy module từ project) -----
  const taskFormColumns = useMemo(() => {
    const moduleOptions =
      project?.project_module
        ?.filter((mod) => mod.name?.trim()) // lọc module có tên không rỗng
        .map((mod: IModule) => ({
          label: mod.name,
          value: mod.id,
        })) || [];
    return [
      {
        key: "name",
        label: "Tên công việc",
        type: "text",
        required: true,
      },
      {
        key: "module",
        label: "Module",
        type: "select",
        options: moduleOptions,
        required: true,
        placeholder: "Chọn module",
      },
      {
        key: "status",
        label: "Trạng thái",
        type: "select",
        options: TASK_STATUS_OPTIONS,
        required: true,
      },
      {
        key: "priority",
        label: "Mức độ ưu tiên",
        type: "select",
        options: PRIORITY_OPTIONS,
        required: true,
      },
      {
        key: "percent_complete",
        label: "Tiến độ (%)",
        type: "number",
        required: false,
        props: { min: 0, max: 100, step: 1 },
      },
      {
        key: "start_date",
        label: "Ngày bắt đầu",
        type: "date",
      },
      {
        key: "expected_end_date",
        label: "Ngày dự kiến kết thúc",
        type: "date",
      },
      {
        key: "actual_end_date",
        label: "Ngày kết thúc thực tế",
        type: "date",
        required: false,
      },
      {
        key: "employee_end_date",
        label: "Ngày kết thúc nhân viên",
        type: "date",
        required: false,
      },
      {
        key: "description",
        label: "Mô tả chi tiết",
        type: "textarea",
      },
    ];
  }, [project]);

  // ----- Render giao diện -----
  if (loading && !project && tasks.length === 0) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 100 }}>
        <Spin size="large" tip="Đang tải dữ liệu dự án..." />
      </div>
    );
  }

  if (error) {
    return <Empty style={{ marginTop: 100 }} description={error} />;
  }

  return (
    <div style={{ padding: "24px" }}>
      {project && (
        <div style={{ marginBottom: 24 }}>
          <Title level={3}>Chi tiết dự án: {project.name}</Title>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          📋 Danh sách các đầu việc
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsTaskModalOpen(true)}
          disabled={!project}
        >
          Thêm Task
        </Button>
      </div>

      <TableComponent
        data={tasks}
        columns={taskColumns}
        onSave={handleUpdateTask}
        onDelete={handleDeleteTask}
        loading={loading}
        scroll={{ x: 800 }}
      />

      <FormModal
        open={isTaskModalOpen}
        title="Tạo Công Việc Mới"
        columns={taskFormColumns as any}
        onSubmit={handleAddTask}
        onCancel={() => setIsTaskModalOpen(false)}
        loading={taskModalLoading}
        initialValues={{
          status: "PENDING",
          priority: 1,
          percent_complete: 0,
          start_date: dayjs().toISOString(),
          module: project?.project_module?.[0]?.id || undefined,
        }}
      />
    </div>
  );
};
