export const getPriorityLabel = (priority?: string) => {
  const labelMap: Record<string, string> = {
    'low': 'Thấp',
    'medium': 'Trung bình',
    'high': 'Cao',
    'critical': 'Khẩn cấp',
  };
  return labelMap[priority?.toLowerCase() ?? ''] ?? 'Chưa xác định';
};

export const getStatusColor = (
    status: string,
  ): "processing" | "success" | "warning" | "default" => {
    const statusMap: Record<
      string,
      "processing" | "success" | "warning" | "default"
    > = {
      Processing: "processing",
      Completed: "success",
      Planning: "warning",
      Pending: "default",
    };
    return statusMap[status] || "default";
  };

  export const getPriorityColor = (priority: number): string => {
    if (priority >= 4) return "red";
    if (priority >= 3) return "orange";
    if (priority >= 2) return "gold";
    return "green";
  };

  export const getRoleColor = (role: string): string => {
    const roleColorMap: Record<string, string> = {
      PM: "purple",
      Manager: "purple",
      Leader: "geekblue",
      Dev: "blue",
      Developer: "blue",
      Tester: "green",
      QA: "green",
      Designer: "magenta",
      BA: "orange",
      FIX: "cyan",
    };
    return roleColorMap[role] || "default";
  };