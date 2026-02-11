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
} from "antd";
import { UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getPriorityColor,
  getRoleColor,
  getStatusColor,
} from "../../Helper/Helpers";
import { TableComponent } from "../../components/TableComponent/TableComponent";
import type { IProject, ITask, IProjectMember } from "../../types/initialTypes";

const { Title, Text } = Typography;

interface IEmployee {
  id: string;
  name?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  [key: string]: any;
}

export const ProjectDetail = () => {
  const [prjDetail, setPrjDetail] = useState<IProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const { id } = useParams<{ id: string }>();

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
      return employee.name || employee.full_name || "N/A";
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

  // ✅ Hàm xử lý khi lưu thay đổi project
  const handleProjectSave = async (record: IProject): Promise<boolean> => {
    try {
      const response = await apiService.put(`/Project/${record.id}`, record);
      if (response?.succeeded) {
        message.success("Cập nhật dự án thành công!");
        setPrjDetail(record);
        return true;
      } else {
        message.error("Cập nhật dự án thất bại!");
        return false;
      }
    } catch (err) {
      console.error("Error updating project:", err);
      message.error("Có lỗi xảy ra khi cập nhật!");
      return false;
    }
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

  // ✅ Hàm xử lý khi lưu thay đổi member
  const handleMemberSave = async (record: any): Promise<boolean> => {
    try {
      // Đảm bảo có đủ thông tin để update
      const updateData = {
        project_id: record.project_id || id,
        employee_id: record.employee_id,
        role: record.role,
        joined_date: record.joined_date,
        is_active: record.is_active,
      };

      const response = await apiService.put(
        `/ProjectMember/${updateData.project_id}/${updateData.employee_id}`,
        updateData,
      );

      if (response?.succeeded) {
        message.success("Cập nhật thành viên thành công!");
        await fetchProjectById();
        return true;
      } else {
        message.error("Cập nhật thành viên thất bại!");
        return false;
      }
    } catch (err) {
      console.error("Error updating member:", err);
      message.error("Có lỗi xảy ra khi cập nhật thành viên!");
      return false;
    }
  };

  // ✅ Hàm xử lý khi xóa member
  const handleMemberDelete = async (record: any) => {
    try {
      const response = await apiService.delete(
        `/ProjectMember/${record.project_id || id}/${record.employee_id}`,
      );
      if (response?.succeeded) {
        message.success("Xóa thành viên thành công!");
        await fetchProjectById();
      } else {
        message.error("Xóa thành viên thất bại!");
      }
    } catch (err) {
      console.error("Error deleting member:", err);
      message.error("Có lỗi xảy ra khi xóa thành viên!");
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
      width: 200,
      editable: false,
      render: (members: any[]) => {
        if (!members || members.length === 0) {
          return <Text type="secondary">Chưa có</Text>;
        }
        return (
          <Space direction="vertical" size={4}>
            {members.map((member, index) => {
              const employeeName = getEmployeeName(
                member.employee_id,
                member.employee,
              );
              return (
                <div
                  key={index}
                  style={{ display: "flex", alignItems: "center", gap: 4 }}
                >
                  <UserOutlined />
                  <Text>{employeeName}</Text>
                </div>
              );
            })}
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

  // ✅ Columns cho member table - CÓ THỂ CHỈNH SỬA bằng cách click vào cell
  const getMemberColumns = () => [
    {
      title: "STT",
      key: "index",
      width: 60,
      editable: false,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Tên nhân viên",
      dataIndex: "employee_id",
      key: "employee_name",
      width: 200,
      editable: false,
      render: (employeeId: string, record: any) => {
        const employeeName = getEmployeeName(employeeId, record.employee);
        return (
          <Space>
            <UserOutlined />
            <Text>{employeeName}</Text>
          </Space>
        );
      },
    },
    {
      title: "Email",
      dataIndex: "employee_id",
      key: "email",
      width: 220,
      editable: false,
      render: (employeeId: string, record: any) => {
        if (record.employee?.email) {
          return record.employee.email;
        }
        const employee = getEmployeeById(employeeId);
        return employee?.email || "-";
      },
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      width: 150,
      editable: true,
      inputType: "select" as const,
      options: [
        { label: "Trưởng nhóm", value: "LEADER" },
        { label: "Thành viên", value: "MEMBER" },
        { label: "Kiểm thử", value: "TESTER" },
        { label: "Lập trình viên", value: "DEVELOPER" },
        { label: "Thiết kế", value: "DESIGNER" },
        { label: "Quản lý dự án", value: "PM" },
      ],
      render: (role: string) => {
        const roleColor = getRoleColor(role);
        const roleMap: Record<string, string> = {
          LEADER: "Trưởng nhóm",
          MEMBER: "Thành viên",
          TESTER: "Kiểm thử",
          DEVELOPER: "Lập trình viên",
          DESIGNER: "Thiết kế",
          PM: "Quản lý dự án",
        };
        return <Tag color={roleColor}>{roleMap[role] || role || "-"}</Tag>;
      },
    },
    {
      title: "Ngày tham gia",
      dataIndex: "joined_date",
      key: "joined_date",
      width: 140,
      editable: true,
      inputType: "date" as const,
      render: (value: string) =>
        value ? dayjs(value).format("DD/MM/YYYY") : "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "is_active",
      key: "is_active",
      width: 140,
      editable: true,
      inputType: "select" as const,
      options: [
        { label: "Hoạt động", value: true },
        { label: "Không hoạt động", value: false },
      ],
      render: (value: boolean) => (
        <Tag color={value !== false ? "success" : "default"}>
          {value !== false ? "Hoạt động" : "Không hoạt động"}
        </Tag>
      ),
    },
  ];

  // ✅ Columns cho project table - CÓ THỂ CHỈNH SỬA bằng cách click vào cell
  const projectColumns = [
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
        value ? dayjs(value).format("DD/MM/YYYY") : "-",
    },
    {
      title: "Ngày kết thúc",
      dataIndex: "end_date",
      key: "end_date",
      editable: true,
      inputType: "date" as const,
      width: 150,
      render: (value: string) =>
        value ? dayjs(value).format("DD/MM/YYYY") : "-",
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
        { label: "Chờ xử lý", value: "Pending" },
        { label: "Đang xử lý", value: "Processing" },
        { label: "Hoàn thành", value: "Completed" },
        { label: "Đã hủy", value: "Cancelled" },
      ],
      render: (value: string) => {
        const statusColor = getStatusColor(value);
        const statusMap: Record<string, string> = {
          Pending: "Chờ xử lý",
          Processing: "Đang xử lý",
          Completed: "Hoàn thành",
          Cancelled: "Đã hủy",
        };
        return <Tag color={statusColor}>{statusMap[value] || value}</Tag>;
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
        const priorityColor = getPriorityColor(value);
        const priorityMap: Record<number, string> = {
          1: "Cao",
          2: "Trung bình",
          3: "Thấp",
        };
        return <Tag color={priorityColor}>{priorityMap[value] || "Thấp"}</Tag>;
      },
    },
    {
      title: "Phân hệ",
      dataIndex: "project_module",
      key: "project_module",
      width: 150,
      editable: false,
      render: (modules: any[]) => {
        if (!modules || modules.length === 0) return "-";
        return (
          <Space wrap>
            {modules.map((module) => (
              <Tag key={module.id}>{module.name}</Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: "Số task",
      dataIndex: "tasks",
      key: "tasks",
      width: 100,
      editable: false,
      render: (tasks: ITask[]) => {
        if (!tasks || tasks.length === 0) return "0";
        return <Tag>{tasks.length}</Tag>;
      },
    },
    {
      title: "Thành viên",
      dataIndex: "project_member",
      key: "project_member",
      width: 120,
      editable: false,
      render: (members: any[]) => {
        if (!members || members.length === 0) return "0";
        return <Tag>{members.length}</Tag>;
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

  return (
    <div style={{ padding: "20px" }}>
      <TableComponent
        data={prjDetail ? [prjDetail] : []}
        columns={projectColumns}
        onSave={handleProjectSave}
        loading={loading}
        expandable={{
          expandedRowRender: (record: IProject) => {
            const hasTasks = record.tasks && record.tasks.length > 0;
            const hasMembers =
              record.project_member && record.project_member.length > 0;

            if (!hasTasks && !hasMembers) {
              return (
                <Empty
                  description="Không có tasks hoặc thành viên"
                  style={{ margin: "20px 0" }}
                />
              );
            }

            const taskColumns = getTaskColumns(record.project_member || []);
            const memberColumns = getMemberColumns();

            return (
              <div style={{ padding: "0 24px" }}>
                {/* Tasks Section - CÓ THỂ CHỈNH SỬA bằng click vào cell */}
                {hasTasks && (
                  <div>
                    <Title level={5} style={{ marginBottom: 16 }}>
                      📋 Danh sách Tasks
                      <Text
                        type="secondary"
                        style={{ fontSize: 12, marginLeft: 8 }}
                      >
                        (Click vào cell để chỉnh sửa)
                      </Text>
                    </Title>
                    <TableComponent
                      data={record.tasks || []}
                      columns={taskColumns}
                      onSave={handleTaskSave}
                      onDelete={handleTaskDelete}
                      loading={false}
                    />
                  </div>
                )}

                {/* Empty States */}
                {!hasTasks && hasMembers && (
                  <>
                    <Empty
                      description="Không có tasks"
                      style={{ margin: "20px 0" }}
                    />
                    <Divider />
                  </>
                )}
              </div>
            );
          },
          rowExpandable: (record: IProject) =>
            (record.tasks && record.tasks.length > 0) ||
            (record.project_member && record.project_member.length > 0),
        }}
      />
    </div>
  );
};
