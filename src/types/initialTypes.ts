export type TaskStatus = "completed" | "inProgress" | "notStarted";
export type Priority = "high" | "medium" | "low";
export type ProjectStatus = "active" | "completed" | "planning" | "paused";
export type Role = "FE" | "BE" | "Full";
export type ITableType = string | null;
export interface IEmployee {
  id: string;            
  full_name?: string | null;     
  position?: string | null;      
  department?: string | null;    
  status?: string | null; 
}

export interface Column {
  key: string;
  label: string;
  type?: "text" | "number" | "select" | "textarea";
  options?: { label: string; value: string | number }[];
  required?: boolean;
  disabled?: boolean;
}


export interface FormPopupProps {
  content?: string | null;
  open?: boolean;
  title?: string;
  columns: Column[];
  initialValues?: any;
  onSubmit: (values: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

export interface APITask {
  task: {
    id: string;
    project_id: string;
    name?: string;
    description?: string | null;
    priority?: number;
    status?: string;
    percent_complete?: number;
    start_date?: string | null;
    expected_end_date?: string;
    actual_end_date?: string | null;
    created_date?: string;
  };
  members: Array<{
    project_id: string;
    employee_id: string;
    full_name?: string;
    role?: string;
    joined_date: string;
    left_date?: string | null;
    is_active?: boolean;
  }>;
}

export interface IProject {
  id: string;
  name?: string| null;
  description?: string| null;
  start_date?: string| null;
  end_date?: string| null| undefined;   
  status?: number | string| null;
  priority?: number;   
  is_active?: number; 
  task?: ITask[];
  duration_days?: string| null;
}

export interface ITask {
  id: string;
  project_id: string;
  name: string;
  description: string;
  priority: number;        
  status: string;         
  percent_complete: number;
  start_date?: string | null;         
  expected_end_date: string;  
  actual_end_date: string | null;
  is_active: boolean;
  is_deleted: boolean;
}
export interface Project {
  id: string;
  name?: string;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
  progress?: number;
  color?: string;
  tasks?: ITask[];
  totalTasks?: number;
  inProgressTasks?: number;
  unassignedTasks?: number;
  overdueTasks?: number;
  completedTasks?: number;
  completionRate?: number;
  assignedMembers?: string[];
  unimplementedDays?: number;
  totalDays?: number;
}

0
export interface ProjectData {
  id: string;
  is_active?: boolean;
  is_deleted?: boolean;
  name?: string;
  description?: string;
  start_date?: string | null;
  end_date?: string;
  status?: string;
  priority?: number;
}

export interface ITaskMember {
  project_id: string;
  employee_id: string;
  full_name: string;
  role: string;
  joined_date: string;
}

export interface TaskData {
  id: string;
  is_active?: boolean;
  is_deleted?: boolean;
  project_id?: string;
  name?: string;
  description?: string;
  priority?: number;
  status?: string;
  percent_complete?: number;
  start_date?: string | null;
  expected_end_date?: string;
  actual_end_date?: string | null;
}

export interface ITaskWithMembers {
  task: ITask;
  members: ITaskMember[];
}

export interface IProjectDetailResponse {
  project: IProject;
  tasks: ITaskWithMembers[];
}

export interface IApiResponse {
  succeeded: boolean;
  message: string;
  errors: null | string[];
  data: IProjectDetailResponse[];
  pagination: null;
}
