import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import apiService from "../../Services/ApiService";
import {
  Card,
  Space,
  Tag,
  Typography,
  Spin,
  Empty,
  message,
  Divider,
  Row,
  Col,
  Select,
  Button,
  Popover,
} from "antd";
import { UserOutlined, PlusOutlined, CloseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getPriorityColor,
  getRoleColor,
  getStatusColor,
} from "../../Helper/Helpers";
import { TableComponent } from "../../components/TableComponent/TableComponent";
import type {
  IProject,
  ITask,
  IProjectMember,
  IEmployee,
} from "../../types/initialTypes";
import { Plus } from "lucide-react";
import { FormModal } from "../../components/FormModal";

const { Title, Text } = Typography;
const memberFormColumns = [
  // {
  //   title: "Nhân viên",
  //   dataIndex: "employee_id",
  //   key: "employee_id",
  //   required: true, // Thêm để FormModal validate
  //   inputType: "select",
  //   options: employees.map((emp) => ({
  //     label: emp.full_name || emp.name,
  //     value: emp.id,
  //   })),
  // },
  {
    title: "Vai trò",
    dataIndex: "role",
    key: "role",
    required: true,
    inputType: "select",
    options: [
      { label: "PM", value: "PM" },
      { label: "LEADER", value: "LEADER" },
      { label: "DEVELOPER", value: "DEVELOPER" },
      { label: "TESTER", value: "TESTER" },
    ],
  },
  {
    title: "Ngày tham gia",
    dataIndex: "joined_date",
    key: "joined_date",
    required: true,
    inputType: "date",
  },
  {
    title: "Ngày rời khỏi",
    dataIndex: "left_date",
    key: "left_date",
    inputType: "date",
  },
];
export const ProjectDetail = () => {
  const [prjDetail, setPrjDetail] = useState<IProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const { id } = useParams<{ id: string }>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"member" | "task" | null>(null);

  const handleAddMember = () => {
    setModalType("member");
    setIsModalOpen(true);
  };

  const fetchEmployees = async (): Promise<void> => {
    setLoadingEmployees(true);
    try {
      const response = await apiService.get("/Employee");
      if (response?.succeeded && response.data) {
        setEmployees(response.data);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchProjectById = async () => {
    setLoading(true);
    try {
      const response = await apiService.get("/Project/detail/", {
        params: {
          Id: id,
        },
      });
      if (response?.succeeded) {
        const projectData: IProject = response.data[0];
        setPrjDetail(projectData);
      }
      console.log(response.data[0]);
    } catch (err) {
      console.error("Error fetching project:", err);
      setError("Không thể tải dữ liệu dự án");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProjectById();
      fetchEmployees();
    }
  }, [id]);

  // ✅ Hàm để lấy thông tin employee theo ID
  const getEmployeeById = (employeeId: string): IEmployee | undefined => {
    return employees.find((emp) => emp.id === employeeId);
  };

  // ✅ Hàm để lấy tên employee
  const getEmployeeName = (employeeId: string, employeeData?: any): string => {
    if (employeeData) {
      return employeeData.name || employeeData.full_name || "N/A";
    }
    const employee = getEmployeeById(employeeId);
    if (employee) {
      return employee.full_name || "N/A";
    }
    return `ID: ${employeeId}`;
  };

  // ✅ Hàm để lấy vai trò của employee từ project_member
  const getEmployeeRoleInProject = (
    employeeId: string,
    projectMembers: any[],
  ): string | null => {
    if (!projectMembers || projectMembers.length === 0) return null;
    const member = projectMembers.find((m) => m.employee_id === employeeId);
    return member?.role || null;
  };

  // ✅ Hàm xử lý khi lưu thay đổi task - CẬP NHẬT MỚI
  const handleTaskSave = async (record: ITask): Promise<boolean> => {
    try {
      // Xử lý module - nếu là object thì lấy id hoặc name, nếu là string thì giữ nguyên
      let moduleValue = "";
      if (record.module) {
        if (typeof record.module === "object" && record.module !== null) {
          // Nếu module là object, lấy id hoặc name
          moduleValue =
            (record.module as any).id || (record.module as any).name || "";
        } else if (typeof record.module === "string") {
          // Nếu module đã là string, giữ nguyên
          moduleValue = record.module;
        }
      }

      // Chuẩn bị payload theo đúng format API yêu cầu
      const payload = {
        is_active: record.is_active ?? true,
        is_deleted: record.is_deleted ?? false,
        id: record.id,
        project_id: record.project_id || prjDetail?.id,
        module: moduleValue, // Đã xử lý để luôn là string
        name: record.name || "",
        description: record.description || "",
        priority: record.priority ?? 0,
        status: record.status || "",
        percent_complete: record.percent_complete ?? 0,
        start_date: record.start_date || null,
        expected_end_date: record.expected_end_date || null,
        actual_end_date: record.actual_end_date || null,
      };

      const response = await apiService.post(
        "https://api.ltc365.com/api/work-track/project/Task",
        payload,
      );

      if (response?.succeeded) {
        message.success("Cập nhật task thành công!");
        // Refresh project data để cập nhật UI
        await fetchProjectById();
        return true;
      } else {
        message.error("Cập nhật task thất bại!");
        return false;
      }
    } catch (err) {
      console.error("Error updating task:", err);
      message.error("Có lỗi xảy ra khi cập nhật task!");
      return false;
    }
  };

  // ✅ Hàm xử lý khi xóa task
  const handleTaskDelete = async (record: ITask) => {
    try {
      const response = await apiService.delete(`/Task/${record.id}`);
      if (response?.succeeded) {
        message.success("Xóa task thành công!");
        await fetchProjectById();
      } else {
        message.error("Xóa task thất bại!");
      }
    } catch (err) {
      console.error("Error deleting task:", err);
      message.error("Có lỗi xảy ra khi xóa task!");
    }
  };

  // ✅ Hàm xử lý khi assign member vào task
  const handleAssignMember = async (
    taskId: string,
    employeeId: string,
    position: string = "MEMBER",
  ): Promise<boolean> => {
    try {
      const payload = {
        id: null,
        task_id: taskId,
        employee_id: employeeId,
        position: position,
      };

      const response = await apiService.post("/project/task/member", payload);

      if (response?.succeeded) {
        message.success("Assign thành viên thành công!");
        await fetchProjectById();
        return true;
      } else {
        message.error("Assign thành viên thất bại!");
        return false;
      }
    } catch (err) {
      console.error("Error assigning member:", err);
      message.error("Có lỗi xảy ra khi assign thành viên!");
      return false;
    }
  };

  // ✅ Hàm xử lý khi remove member khỏi task
  const handleRemoveMember = async (
    taskId: string,
    employeeId: string,
  ): Promise<boolean> => {
    try {
      const response = await apiService.delete(
        `/project/task/member/${taskId}/${employeeId}`,
      );

      if (response?.succeeded) {
        message.success("Xóa thành viên khỏi task thành công!");
        await fetchProjectById();
        return true;
      } else {
        message.error("Xóa thành viên thất bại!");
        return false;
      }
    } catch (err) {
      console.error("Error removing member:", err);
      message.error("Có lỗi xảy ra khi xóa thành viên!");
      return false;
    }
  };

  // ✅ Columns cho task table - CÓ THỂ CHỈNH SỬA bằng cách click vào cell
  const getTaskColumns = (projectMembers: any[]) => [
    {
      title: "Tên task",
      dataIndex: "name",
      key: "name",
      width: 180,
      fixed: "left" as const,
      editable: true,
      inputType: "text" as const,
    },
    {
      title: "Phân hệ",
      dataIndex: "module",
      key: "module",
      width: 130,
      editable: false,
      render: (module: any) => {
        if (!module) return "-";
        return <Tag>{module.name}</Tag>;
      },
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      width: 200,
      editable: true,
      inputType: "text" as const,
      render: (value: string) => value || "-",
    },
    {
      title: "Ngày bắt đầu",
      dataIndex: "start_date",
      key: "start_date",
      width: 130,
      editable: true,
      inputType: "date" as const,
      render: (value: string) =>
        value ? dayjs(value).format("DD/MM/YYYY") : "-",
    },
    {
      title: "Ngày dự kiến",
      dataIndex: "expected_end_date",
      key: "expected_end_date",
      width: 130,
      editable: true,
      inputType: "date" as const,
      render: (value: string) =>
        value ? dayjs(value).format("DD/MM/YYYY") : "-",
    },
    {
      title: "Ngày hoàn thành",
      dataIndex: "actual_end_date",
      key: "actual_end_date",
      width: 140,
      editable: true,
      inputType: "date" as const,
      render: (value: string) =>
        value ? dayjs(value).format("DD/MM/YYYY") : "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      editable: true,
      inputType: "select" as const,
      options: [
        { label: "Chờ xử lý", value: "PENDING" },
        { label: "Đang xử lý", value: "PROCESSING" },
        { label: "Hoàn thành", value: "COMPLETED" },
        { label: "Đã hủy", value: "CANCELLED" },
        { label: "Mở", value: "OPEN" },
      ],
      render: (value: string) => {
        const statusColor = getStatusColor(value);
        const statusMap: Record<string, string> = {
          PENDING: "Chờ xử lý",
          PROCESSING: "Đang xử lý",
          COMPLETED: "Hoàn thành",
          CANCELLED: "Đã hủy",
          OPEN: "Mở",
        };
        return <Tag color={statusColor}>{statusMap[value] || value}</Tag>;
      },
    },
    {
      title: "Tiến độ (%)",
      dataIndex: "percent_complete",
      key: "percent_complete",
      width: 100,
      editable: true,
      inputType: "number" as const,
      render: (value: number) => `${value || 0}%`,
    },
    {
      title: "Ưu tiên",
      dataIndex: "priority",
      key: "priority",
      width: 120,
      editable: true,
      inputType: "select" as const,
      options: [
        { label: "Thấp", value: 0 },
        { label: "Trung bình", value: 1 },
        { label: "Cao", value: 2 },
      ],
      render: (value: number) => {
        const priorityColor = getPriorityColor(value);
        const priorityMap: Record<number, string> = {
          0: "Thấp",
          1: "Trung bình",
          2: "Cao",
        };
        return <Tag color={priorityColor}>{priorityMap[value] || "Thấp"}</Tag>;
      },
    },
    {
      title: "Thành viên",
      dataIndex: "task_member",
      key: "task_member",
      width: 250,
      editable: false,
      render: (members: any[], record: ITask) => {
        // Lấy danh sách member hiện tại của task
        const currentMemberIds = members?.map((m) => m.employee_id) || [];

        // Lọc danh sách project members chưa được assign vào task này
        const availableMembers = (prjDetail?.project_member || []).filter(
          (pm) => !currentMemberIds.includes(pm.employee_id),
        );

        const AssignMemberPopover = () => {
          const [selectedEmployeeId, setSelectedEmployeeId] =
            useState<string>("");
          const [selectedPosition, setSelectedPosition] =
            useState<string>("MEMBER");

          const handleAssign = async () => {
            if (!selectedEmployeeId) {
              message.warning("Vui lòng chọn nhân viên!");
              return;
            }
            const success = await handleAssignMember(
              record.id,
              selectedEmployeeId,
              selectedPosition,
            );
            if (success) {
              setSelectedEmployeeId("");
              setSelectedPosition("MEMBER");
            }
          };

          return (
            <div style={{ width: 300 }}>
              <Space direction="vertical" style={{ width: "100%" }} size={12}>
                <div>
                  <Text strong>Chọn nhân viên:</Text>
                  <Select
                    style={{ width: "100%", marginTop: 4 }}
                    placeholder="Chọn nhân viên"
                    value={selectedEmployeeId || undefined}
                    onChange={setSelectedEmployeeId}
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    options={availableMembers.map((pm) => ({
                      label: pm.full_name || pm.employee_id,
                      value: pm.employee_id,
                    }))}
                  />
                </div>
                <div>
                  <Text strong>Vai trò trong task:</Text>
                  <Select
                    style={{ width: "100%", marginTop: 4 }}
                    value={selectedPosition}
                    onChange={setSelectedPosition}
                    options={[
                      { label: "Thành viên", value: "MEMBER" },
                      { label: "Trưởng nhóm", value: "LEADER" },
                      { label: "Lập trình viên", value: "DEVELOPER" },
                      { label: "Kiểm thử", value: "TESTER" },
                      { label: "Thiết kế", value: "DESIGNER" },
                    ]}
                  />
                </div>
                <Button
                  type="primary"
                  block
                  onClick={handleAssign}
                  disabled={!selectedEmployeeId}
                >
                  Assign
                </Button>
              </Space>
            </div>
          );
        };

        return (
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            {/* Hiển thị danh sách members hiện tại */}
            {members && members.length > 0 ? (
              members.map((member, index) => {
                const employeeName = getEmployeeName(
                  member.employee_id,
                  member.employee,
                );
                return (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 4,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <UserOutlined />
                      <Text>{employeeName}</Text>
                    </div>
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<CloseOutlined />}
                      onClick={() =>
                        handleRemoveMember(record.id, member.employee_id)
                      }
                    />
                  </div>
                );
              })
            ) : (
              <Text type="secondary">Chưa có thành viên</Text>
            )}

            {/* Nút Assign Member */}
            {availableMembers.length > 0 && (
              <Popover
                content={<AssignMemberPopover />}
                title="Assign thành viên vào task"
                trigger="click"
                placement="leftTop"
              >
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  style={{ width: "100%" }}
                >
                  Assign thành viên
                </Button>
              </Popover>
            )}
          </Space>
        );
      },
    },
    {
      title: "Vai trò",
      dataIndex: "task_member",
      key: "task_member_role",
      width: 150,
      editable: false,
      render: (members: any[]) => {
        if (!members || members.length === 0) {
          return <Text type="secondary">-</Text>;
        }
        const roleMap: Record<string, string> = {
          LEADER: "Trưởng nhóm",
          MEMBER: "Thành viên",
          TESTER: "Kiểm thử",
          DEVELOPER: "Lập trình viên",
          DESIGNER: "Thiết kế",
          PM: "Quản lý",
        };
        return (
          <Space direction="vertical" size={4}>
            {members.map((member, index) => {
              const projectRole = getEmployeeRoleInProject(
                member.employee_id,
                projectMembers,
              );
              const roleColor = getRoleColor(projectRole || "");
              return (
                <Tag key={index} color={roleColor}>
                  {projectRole ? roleMap[projectRole] || projectRole : "N/A"}
                </Tag>
              );
            })}
          </Space>
        );
      },
    },
  ];

  if (loading || loadingEmployees) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !prjDetail) {
    return (
      <div style={{ padding: "20px" }}>
        <Empty description={error || "Không tìm thấy dự án"} />
      </div>
    );
  }

  const taskColumns = getTaskColumns(prjDetail.project_member || []);

  return (
    <div
      style={{
        padding: "24px",
        background: "#f5f7fa",
        minHeight: "100vh",
      }}
    >
      {/* Header Section */}
      <div
        style={{
          background: "linear-gradient(135deg, #1abc9c 0%, #16a085 100%)",
          borderRadius: "12px",
          padding: "24px 32px",
          marginBottom: "24px",
          boxShadow: "0 4px 12px rgba(26, 188, 156, 0.15)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "white",
          }}
        >
          <div>
            <Title
              level={3}
              style={{
                margin: 0,
                color: "white",
                fontWeight: 600,
                fontSize: "24px",
              }}
            >
              📋 Danh sách Tasks
            </Title>
            <Text
              style={{
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "14px",
                marginTop: "4px",
                display: "block",
              }}
            >
              Click vào ô để chỉnh sửa thông tin task
            </Text>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "12px" }}>
            <Button
              onClick={handleAddMember}
              icon={<Plus size={18} />}
              // onClick={() => handleAddMember()}
              style={{
                height: "40px",
                padding: "0 24px",
                background: "rgba(255, 255, 255, 0.2)",
                border: "2px solid rgba(255, 255, 255, 0.4)",
                borderRadius: "8px",
                color: "#ffffff",
                fontWeight: "600",
                fontSize: "14px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backdropFilter: "blur(10px)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Thêm nhân viên
            </Button>
          </div>
        </div>
      </div>
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
        }}
      >
        {prjDetail.tasks && prjDetail.tasks.length > 0 ? (
          <div>
            {/* Stats Summary */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                marginBottom: "24px",
                padding: "16px",
                background: "#f8f9fa",
                borderRadius: "8px",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <Text
                  type="secondary"
                  style={{ fontSize: "12px", display: "block" }}
                >
                  Tổng Tasks
                </Text>
                <Text strong style={{ fontSize: "24px", color: "#1abc9c" }}>
                  {prjDetail.tasks.length}
                </Text>
              </div>
              <div style={{ textAlign: "center" }}>
                <Text
                  type="secondary"
                  style={{ fontSize: "12px", display: "block" }}
                >
                  Thành viên
                </Text>
                <Text strong style={{ fontSize: "24px", color: "#3498db" }}>
                  {prjDetail.project_member?.length || 0}
                </Text>
              </div>
              <div style={{ textAlign: "center" }}>
                <Text
                  type="secondary"
                  style={{ fontSize: "12px", display: "block" }}
                >
                  Hoàn thành
                </Text>
                <Text strong style={{ fontSize: "24px", color: "#2ecc71" }}>
                  {
                    prjDetail.tasks.filter((t) => t.status === "Completed")
                      .length
                  }
                </Text>
              </div>
              <div style={{ textAlign: "center" }}>
                <Text
                  type="secondary"
                  style={{ fontSize: "12px", display: "block" }}
                >
                  Đang xử lý
                </Text>
                <Text strong style={{ fontSize: "24px", color: "#f39c12" }}>
                  {
                    prjDetail.tasks.filter((t) => t.status === "Processing")
                      .length
                  }
                </Text>
              </div>
            </div>

            {/* Table */}
            <TableComponent
              data={prjDetail.tasks}
              columns={taskColumns}
              onSave={handleTaskSave}
              onDelete={handleTaskDelete}
              loading={false}
            />
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              background: "#fafbfc",
              borderRadius: "8px",
              border: "2px dashed #e1e4e8",
            }}
          >
            <div
              style={{
                fontSize: "48px",
                marginBottom: "16px",
                opacity: 0.6,
              }}
            >
              📝
            </div>
            <Title
              level={4}
              style={{
                color: "#8b949e",
                fontWeight: 500,
                marginBottom: "8px",
              }}
            >
              Chưa có task nào
            </Title>
            <Text
              type="secondary"
              style={{
                fontSize: "14px",
                display: "block",
                marginBottom: "20px",
              }}
            >
              Hãy tạo task đầu tiên để bắt đầu quản lý công việc
            </Text>
            <Button
              type="primary"
              icon={<Plus size={18} />}
              // onClick={() => handleAddTask()}
              style={{
                height: "40px",
                padding: "0 32px",
                background: "linear-gradient(135deg, #1abc9c 0%, #16a085 100%)",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "14px",
                boxShadow: "0 4px 12px rgba(26, 188, 156, 0.3)",
              }}
            >
              Tạo task đầu tiên
            </Button>
          </div>
        )}
      </div>
      <FormModal
        open={isModalOpen && modalType === "member"}
        title="Thêm nhân viên vào dự án"
        columns={memberFormColumns}
        onSubmit={() => {}}
        onCancel={() => {
          setIsModalOpen(false);
          setModalType(null);
        }}
        loading={loading}
      />
    </div>
  );
};
