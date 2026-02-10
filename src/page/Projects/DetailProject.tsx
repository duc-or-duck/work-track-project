import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { IApiResponse } from "../../types/initialTypes";
import apiService from "../../Services/ApiService";
import {
  Card,
  Space,
  Tag,
  Typography,
  Spin,
  Row,
  Col,
  Empty,
  message,
  Button,
  Progress,
} from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FlagOutlined,
  TeamOutlined,
  FileTextOutlined,
  UserOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getPriorityColor,
  getRoleColor,
  getStatusColor,
} from "../../Helper/Helpers";
import { TableComponent } from "../../components/TableComponent";

const { Title, Text } = Typography;

// Types cho dữ liệu
interface IEmployee {
  id: string;
  full_name: string;
  position?: string;
}

interface ITaskMember {
  id: string;
  task_id: string;
  employee_id: string;
  full_name: string;
  position: string;
  assigned_date: string;
}

interface ITask {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  priority: number;
  status: string;
  percent_complete: number;
  start_date: string;
  expected_end_date: string;
  actual_end_date: string | null;
  employee_end_date: string | null;
  created_at: string;
  task_member: ITaskMember[];
}

interface IProjectMember {
  id?: string;
  project_id: string;
  employee_id: string;
  joined_date: string;
  left_date: string;
  role: string;
}

interface IProjectDetail {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  priority: number;
  tasks: ITask[];
  project_member: IProjectMember[];
}

interface ProjectInfoDataItem {
  key: string;
  label: string;
  value: string | number | React.ReactNode;
  icon: React.ReactNode;
}

export const ProjectDetail = () => {
  const [prjDetail, setPrjDetail] = useState<IProjectDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [showProjectMembers, setShowProjectMembers] = useState<boolean>(false);
  const [employees, setEmployees] = useState<IEmployee[]>([]);
  const { id } = useParams<{ id: string }>();

  const fetchEmployees = async (): Promise<void> => {
    try {
      const response: IApiResponse = await apiService.get("/Employee");
      if (response?.succeeded && response.data) {
        setEmployees(response.data);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const fetchProjectById = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response: IApiResponse = await apiService.get("/Project/detail/", {
        params: {
          Id: id,
        },
      });

      if (response?.succeeded && response.data && response.data.length > 0) {
        const projectData: IProjectDetail = response.data[0];
        // Thêm id cho project members (sử dụng employee_id làm id)
        if (projectData.project_member) {
          projectData.project_member = projectData.project_member.map(
            (member) => ({
              ...member,
              id: member.employee_id,
            }),
          );
        }
        setPrjDetail(projectData);
      } else {
        setError("Failed to fetch project details");
      }
    } catch (err) {
      setError("An error occurred while fetching project details");
      console.error("Error fetching project:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProjectById();
      fetchEmployees();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Helper function để format date về ISO string cho API
  const formatDateForAPI = (date: string | Date): string => {
    if (!date) return "";

    // Nếu đã là string ISO, return luôn
    if (typeof date === "string" && date.includes("T")) {
      return date;
    }

    // Nếu là Date object hoặc string khác, convert về ISO
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toISOString();
  };

  // Handlers cho Tasks
  const handleSaveTask = async (updatedTask: ITask): Promise<boolean> => {
    try {
      const payload = {
        ...updatedTask,
        id: updatedTask.id,
        // Format dates trước khi gửi API
        start_date: formatDateForAPI(updatedTask.start_date),
        expected_end_date: formatDateForAPI(updatedTask.expected_end_date),
      };

      const response = await apiService.post("project/Task", payload);
      if (response.succeeded) {
        message.success("Cập nhật công việc thành công");
        await fetchProjectById();
        return true;
      }
      message.error("Cập nhật thất bại");
      return false;
    } catch (error) {
      message.error("Có lỗi xảy ra khi cập nhật");
      console.error(error);
      return false;
    }
  };

  const handleDeleteTask = async (task: ITask): Promise<void> => {
    try {
      const response = await apiService.post("project/Task", {
        ...task,
        is_deleted: true,
      });
      if (response.succeeded) {
        message.success("Xóa công việc thành công");
        await fetchProjectById();
      } else {
        message.error("Xóa thất bại");
      }
    } catch (error) {
      message.error("Có lỗi xảy ra khi xóa");
      console.error(error);
    }
  };

  // Handlers cho Task Members
  const handleSaveTaskMember = async (
    updatedMember: ITaskMember,
  ): Promise<boolean> => {
    try {
      // Tìm thông tin nhân viên từ employee_id
      const employee = employees.find(
        (e) => e.id === updatedMember.employee_id,
      );

      const payload = {
        id: updatedMember.id,
        task_id: updatedMember.task_id,
        employee_id: updatedMember.employee_id,
        position: updatedMember.position,
        full_name: employee?.full_name || updatedMember.full_name,
      };

      const response = await apiService.post(
        "/api/work-track/project/Task/member",
        payload,
      );
      if (response.succeeded) {
        message.success("Cập nhật thành viên công việc thành công");
        await fetchProjectById();
        return true;
      }
      message.error("Cập nhật thất bại");
      return false;
    } catch (error) {
      message.error("Có lỗi xảy ra khi cập nhật");
      console.error(error);
      return false;
    }
  };

  const handleDeleteTaskMember = async (member: ITaskMember): Promise<void> => {
    try {
      const response = await apiService.post(
        "/api/work-track/project/Task/member",
        {
          id: member.id,
          task_id: member.task_id,
          employee_id: member.employee_id,
          position: member.position,
          is_deleted: true,
        },
      );
      if (response.succeeded) {
        message.success("Xóa thành viên công việc thành công");
        await fetchProjectById();
      } else {
        message.error("Xóa thất bại");
      }
    } catch (error) {
      message.error("Có lỗi xảy ra khi xóa");
      console.error(error);
    }
  };

  // Handlers cho Project Members
  const handleSaveMember = async (
    updatedMember: IProjectMember,
  ): Promise<boolean> => {
    try {
      const payload = {
        ...updatedMember,
        employee_id: updatedMember.employee_id,
        project_id: updatedMember.project_id,
      };

      const response = await apiService.post("/ProjectMember", payload);
      if (response.succeeded) {
        message.success("Cập nhật thành viên thành công");
        await fetchProjectById();
        return true;
      }
      message.error("Cập nhật thất bại");
      return false;
    } catch (error) {
      message.error("Có lỗi xảy ra khi cập nhật");
      console.error(error);
      return false;
    }
  };

  const handleDeleteMember = async (member: IProjectMember): Promise<void> => {
    try {
      const response = await apiService.post("/ProjectMember", {
        ...member,
        is_deleted: true,
      });
      if (response.succeeded) {
        message.success("Xóa thành viên thành công");
        await fetchProjectById();
      } else {
        message.error("Xóa thất bại");
      }
    } catch (error) {
      message.error("Có lỗi xảy ra khi xóa");
      console.error(error);
    }
  };

  // Columns cho Task Members (nested table)
  const taskMemberColumns = [
    {
      title: "Nhân viên",
      dataIndex: "employee_id",
      key: "employee_id",
      width: "35%",
      type: "select" as const,
      options: employees.map((emp) => ({
        label: `${emp.full_name} (${emp.id})`,
        value: emp.id,
      })),
      render: (employeeId: string, record: ITaskMember) => {
        const employee = employees.find((e) => e.id === employeeId);
        return (
          <Space>
            <UserOutlined style={{ color: "#1890ff" }} />
            <div>
              <Text strong style={{ color: "#1890ff" }}>
                {record.full_name || employee?.full_name || employeeId}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: "11px" }}>
                {employeeId}
              </Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Vị trí",
      dataIndex: "position",
      key: "position",
      width: "25%",
      type: "select" as const,
      options: [
        { label: "FE", value: "FE" },
        { label: "BE", value: "BE" },
        { label: "QC", value: "QC" },
        { label: "BA", value: "BA" },
        { label: "Designer", value: "Designer" },
        { label: "Tester", value: "Tester" },
      ],
      render: (position: string) => (
        <Tag color={getRoleColor(position)} icon={<UserOutlined />}>
          {position}
        </Tag>
      ),
    },
    {
      title: "Ngày phân công",
      dataIndex: "assigned_date",
      key: "assigned_date",
      width: "40%",
      render: (date: string) =>
        date && date !== "0001-01-01T00:00:00" ? (
          <Text style={{ fontSize: "12px" }}>
            <CalendarOutlined /> {dayjs(date).format("DD/MM/YYYY HH:mm")}
          </Text>
        ) : (
          <Text type="secondary">N/A</Text>
        ),
    },
  ];

  // Columns cho Tasks với TableComponent
  const taskColumns = [
    {
      title: "Tên công việc",
      dataIndex: "name",
      key: "name",
      width: "18%",
      type: "text" as const,
      render: (text: string) => (
        <Text strong style={{ color: "#1890ff" }}>
          {text}
        </Text>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      width: "15%",
      type: "text" as const,
      ellipsis: true,
      render: (text: string | null) => (
        <Text type="secondary">{text || "Không có mô tả"}</Text>
      ),
    },
    {
      title: "Ưu tiên",
      dataIndex: "priority",
      key: "priority",
      width: "10%",
      type: "select" as const,
      options: [
        { label: "Cao", value: 1 },
        { label: "Trung bình", value: 2 },
        { label: "Thấp", value: 3 },
      ],
      render: (priority: number) => {
        const priorityMap: Record<number, { text: string; color: string }> = {
          1: { text: "Cao", color: "red" },
          2: { text: "Trung bình", color: "orange" },
          3: { text: "Thấp", color: "default" },
        };
        const p = priorityMap[priority] || {
          text: "Không xác định",
          color: "default",
        };
        return (
          <Tag color={p.color} icon={<FlagOutlined />}>
            {p.text}
          </Tag>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: "11%",
      type: "select" as const,
      options: [
        { label: "Planning", value: "Planning" },
        { label: "Processing", value: "Processing" },
        { label: "Completed", value: "Completed" },
        { label: "Cancelled", value: "Cancelled" },
      ],
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: "Tiến độ (%)",
      dataIndex: "percent_complete",
      key: "percent_complete",
      width: "10%",
      type: "number" as const,
      render: (percent: number) => (
        <Progress
          percent={percent}
          size="small"
          status={percent === 100 ? "success" : "active"}
        />
      ),
    },
    {
      title: "Ngày bắt đầu",
      dataIndex: "start_date",
      key: "start_date",
      width: "10%",
      type: "date" as const,
      render: (date: string) => {
        if (!date || date === "0001-01-01T00:00:00") {
          return <Text type="secondary">N/A</Text>;
        }
        return (
          <Text style={{ fontSize: "12px" }}>
            <CalendarOutlined /> {dayjs(date).format("DD/MM/YYYY")}
          </Text>
        );
      },
    },
    {
      title: "Ngày kết thúc",
      dataIndex: "expected_end_date",
      key: "expected_end_date",
      width: "10%",
      type: "date" as const,
      render: (date: string) => {
        if (!date || date === "0001-01-01T00:00:00") {
          return <Text type="secondary">N/A</Text>;
        }
        return (
          <Text style={{ fontSize: "12px" }}>
            <ClockCircleOutlined /> {dayjs(date).format("DD/MM/YYYY")}
          </Text>
        );
      },
    },
    {
      title: "Thành viên",
      key: "members",
      width: "16%",
      render: (_: unknown, record: ITask) => {
        const memberCount = record.task_member?.length || 0;
        const isExpanded = expandedRowKeys.includes(record.id);

        if (memberCount === 0) {
          return (
            <Space>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                <UserOutlined /> Chưa có
              </Text>
              <Button
                size="small"
                type="link"
                onClick={() => {
                  setExpandedRowKeys(
                    isExpanded
                      ? expandedRowKeys.filter((k) => k !== record.id)
                      : [...expandedRowKeys, record.id],
                  );
                }}
              >
                Quản lý
              </Button>
            </Space>
          );
        }

        return (
          <Space>
            <Tag
              color={isExpanded ? "green" : "blue"}
              icon={<TeamOutlined />}
              style={{ cursor: "pointer" }}
              onClick={() => {
                setExpandedRowKeys(
                  isExpanded
                    ? expandedRowKeys.filter((k) => k !== record.id)
                    : [...expandedRowKeys, record.id],
                );
              }}
            >
              {memberCount} thành viên
            </Tag>
            <Text
              type="secondary"
              style={{ fontSize: "11px", cursor: "pointer" }}
              onClick={() => {
                setExpandedRowKeys(
                  isExpanded
                    ? expandedRowKeys.filter((k) => k !== record.id)
                    : [...expandedRowKeys, record.id],
                );
              }}
            >
              ({isExpanded ? "Đóng" : "Mở"})
            </Text>
          </Space>
        );
      },
    },
  ];

  // Columns cho Project Members với TableComponent
  const memberColumns = [
    {
      title: "Nhân viên",
      dataIndex: "employee_id",
      key: "employee_id",
      width: "35%",
      type: "select" as const,
      options: employees.map((emp) => ({
        label: `${emp.full_name} (${emp.id})`,
        value: emp.id,
      })),
      render: (employeeId: string) => {
        const employee = employees.find((e) => e.id === employeeId);
        return (
          <Space>
            <UserOutlined style={{ color: "#1890ff" }} />
            <div>
              <Text strong>{employee?.full_name || employeeId}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: "11px" }}>
                {employeeId}
              </Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      width: "20%",
      type: "select" as const,
      options: [
        { label: "PM", value: "PM" },
        { label: "DEV", value: "DEV" },
        { label: "QC", value: "QC" },
        { label: "BA", value: "BA" },
        { label: "Designer", value: "Designer" },
        { label: "Tester", value: "Tester" },
      ],
      render: (role: string) => (
        <Tag color={getRoleColor(role)} icon={<UserOutlined />}>
          {role}
        </Tag>
      ),
    },
    {
      title: "Ngày tham gia",
      dataIndex: "joined_date",
      key: "joined_date",
      width: "22.5%",
      render: (date: string) =>
        date && date !== "0001-01-01T00:00:00" ? (
          <Text style={{ fontSize: "12px" }}>
            <CalendarOutlined /> {dayjs(date).format("DD/MM/YYYY")}
          </Text>
        ) : (
          <Text type="secondary">N/A</Text>
        ),
    },
    {
      title: "Ngày rời đi",
      dataIndex: "left_date",
      key: "left_date",
      width: "22.5%",
      render: (date: string) =>
        date && date !== "0001-01-01T00:00:00" ? (
          <Text style={{ fontSize: "12px" }}>
            <ClockCircleOutlined /> {dayjs(date).format("DD/MM/YYYY")}
          </Text>
        ) : (
          <Tag color="success">Đang làm việc</Tag>
        ),
    },
  ];

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  if (error || !prjDetail) {
    return (
      <div style={{ padding: "24px" }}>
        <Card>
          <Empty
            description={
              <Text type="danger">{error || "Không tìm thấy dự án"}</Text>
            }
          />
        </Card>
      </div>
    );
  }

  const completedTasks: number =
    prjDetail.tasks?.filter((t: ITask) => t.status === "Completed").length || 0;
  const totalTasks: number = prjDetail.tasks?.length || 0;

  // Data cho bảng thông tin chi tiết
  const projectInfoData: ProjectInfoDataItem[] = [
    {
      key: "1",
      label: "Ngày bắt đầu",
      value:
        prjDetail.start_date && prjDetail.start_date !== "0001-01-01T00:00:00"
          ? dayjs(prjDetail.start_date).format("DD/MM/YYYY")
          : "Chưa xác định",
      icon: <CalendarOutlined style={{ color: "#1890ff" }} />,
    },
    {
      key: "2",
      label: "Ngày kết thúc",
      value:
        prjDetail.end_date && prjDetail.end_date !== "0001-01-01T00:00:00"
          ? dayjs(prjDetail.end_date).format("DD/MM/YYYY")
          : "Chưa xác định",
      icon: <ClockCircleOutlined style={{ color: "#52c41a" }} />,
    },
    {
      key: "3",
      label: "Trạng thái",
      value: (
        <Tag color={getStatusColor(prjDetail.status)}>{prjDetail.status}</Tag>
      ),
      icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
    },
    {
      key: "4",
      label: "Độ ưu tiên",
      value: (
        <Tag color={getPriorityColor(prjDetail.priority)}>
          {prjDetail.priority === 1
            ? "Cao"
            : prjDetail.priority === 2
              ? "Trung bình"
              : prjDetail.priority === 3
                ? "Thấp"
                : "Không xác định"}
        </Tag>
      ),
      icon: <FlagOutlined style={{ color: "#faad14" }} />,
    },
    {
      key: "5",
      label: "Tổng số công việc",
      value: totalTasks,
      icon: <TeamOutlined style={{ color: "#722ed1" }} />,
    },
    {
      key: "6",
      label: "Tổng số thành viên",
      value: prjDetail.project_member?.length || 0,
      icon: <TeamOutlined style={{ color: "#13c2c2" }} />,
    },
  ];

  return (
    <div
      style={{
        padding: "16px",
        background: "#f0f2f5",
        minHeight: "100vh",
        overflow: "auto",
      }}
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {/* Header Section with Project Info */}
        <Card
          bordered={false}
          style={{
            borderRadius: "8px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}
          bodyStyle={{ padding: "16px" }}
        >
          <Row gutter={[16, 16]} align="top">
            <Col xs={24} lg={10}>
              <Space align="center" size="middle">
                <FileTextOutlined
                  style={{ fontSize: "28px", color: "#1890ff" }}
                />
                <div>
                  <Title level={4} style={{ margin: 0, marginBottom: 4 }}>
                    {prjDetail.name}
                  </Title>
                  <Text type="secondary" style={{ fontSize: "13px" }}>
                    {prjDetail.description || "Không có mô tả"}
                  </Text>
                </div>
              </Space>
            </Col>

            <Col xs={24} lg={14}>
              <Row gutter={[12, 12]}>
                {projectInfoData.map((item) => (
                  <Col xs={12} sm={8} key={item.key}>
                    <Space
                      direction="vertical"
                      size={4}
                      style={{ width: "100%" }}
                    >
                      <Space size={6}>
                        {item.icon}
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          {item.label}
                        </Text>
                      </Space>
                      <div style={{ paddingLeft: "28px" }}>
                        {typeof item.value === "string" ||
                        typeof item.value === "number" ? (
                          <Text strong style={{ fontSize: "13px" }}>
                            {item.value}
                          </Text>
                        ) : (
                          item.value
                        )}
                      </div>
                    </Space>
                  </Col>
                ))}
              </Row>
            </Col>
          </Row>
        </Card>

        {/* Main Content Layout */}
        <Row gutter={[12, 12]}>
          {/* Full Width - Tasks and Members */}
          <Col xs={24}>
            <Card
              title={
                <Space
                  style={{ width: "100%", justifyContent: "space-between" }}
                >
                  <Space>
                    <Text strong style={{ fontSize: "14px" }}>
                      Danh sách công việc
                    </Text>
                    <Tag color="blue">{prjDetail.tasks?.length || 0}</Tag>
                  </Space>
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => message.info("Tính năng đang phát triển")}
                  >
                    Thêm
                  </Button>
                </Space>
              }
              bordered={false}
              style={{
                borderRadius: "8px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              }}
              bodyStyle={{ padding: "12px" }}
            >
              {prjDetail.tasks && prjDetail.tasks.length > 0 ? (
                <div>
                  <TableComponent
                    data={prjDetail.tasks}
                    columns={taskColumns}
                    onSave={handleSaveTask}
                    onDelete={handleDeleteTask}
                  />

                  {/* Task Members Section - Expandable under main table */}
                  {expandedRowKeys.length > 0 && (
                    <Card
                      style={{ marginTop: "12px" }}
                      size="small"
                      title={
                        <Space>
                          <TeamOutlined />
                          <Text strong style={{ fontSize: "13px" }}>
                            Thành viên công việc
                          </Text>
                          <Button
                            size="small"
                            type="link"
                            onClick={() => setExpandedRowKeys([])}
                          >
                            Đóng
                          </Button>
                        </Space>
                      }
                    >
                      {prjDetail.tasks
                        .filter((task) => expandedRowKeys.includes(task.id))
                        .map((task) => (
                          <div key={task.id} style={{ marginBottom: "16px" }}>
                            <Space
                              style={{
                                marginBottom: "8px",
                                padding: "8px",
                                background: "#f0f2f5",
                                borderRadius: "4px",
                                width: "100%",
                              }}
                            >
                              <Text strong>{task.name}</Text>
                              <Tag color="blue">
                                {task.task_member?.length || 0} thành viên
                              </Tag>
                              <Button
                                size="small"
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() =>
                                  message.info("Tính năng đang phát triển")
                                }
                              >
                                Thêm thành viên
                              </Button>
                            </Space>
                            {task.task_member && task.task_member.length > 0 ? (
                              <TableComponent
                                data={task.task_member}
                                columns={taskMemberColumns}
                                onSave={handleSaveTaskMember}
                                onDelete={handleDeleteTaskMember}
                              />
                            ) : (
                              <Empty
                                description="Chưa có thành viên"
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                              />
                            )}
                          </div>
                        ))}
                    </Card>
                  )}
                </div>
              ) : (
                <Empty
                  description="Chưa có công việc nào"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}

              {/* Project Members Section - Expandable Toggle */}
              <div style={{ marginTop: "16px" }}>
                <Space
                  style={{
                    width: "100%",
                    justifyContent: "space-between",
                    padding: "8px",
                    background: "#f0f5ff",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                  onClick={() => setShowProjectMembers(!showProjectMembers)}
                >
                  <Space>
                    <TeamOutlined style={{ color: "#1890ff" }} />
                    <Text strong style={{ fontSize: "14px" }}>
                      Thành viên dự án
                    </Text>
                    <Tag color="purple">
                      {prjDetail.project_member?.length || 0}
                    </Tag>
                  </Space>
                  <Space>
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        message.info("Tính năng đang phát triển");
                      }}
                    >
                      Thêm
                    </Button>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      {showProjectMembers ? "Thu gọn" : "Mở rộng"}
                    </Text>
                  </Space>
                </Space>

                {showProjectMembers && (
                  <div style={{ marginTop: "12px" }}>
                    {prjDetail.project_member &&
                    prjDetail.project_member.length > 0 ? (
                      <TableComponent
                        data={prjDetail.project_member}
                        columns={memberColumns}
                        onSave={handleSaveMember}
                        onDelete={handleDeleteMember}
                      />
                    ) : (
                      <Empty
                        description="Chưa có thành viên"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )}
                  </div>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </Space>
    </div>
  );
};
