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

export interface IColumn {
 title: string;
  dataIndex: string;
  key: string;
  editable?: boolean;
  inputType?: string | "text" | "number" | "select" | "date" | null | undefined;
  options?: Array<{ label: string; value: string | number }>;
  width?: number;
  fixed?: "left" | "right"  | undefined ;
  render?: (text: any, record: any, index: number) => React.ReactNode;
  [key: string]: any;
}

export interface TableComponentProps {
  data: any[];
  columns: IColumn[];
  onSave?: (record: any) => Promise<boolean>;
  onDelete?: (record: any) => void;
  loading?: boolean;
  expandable?: any; // ✅ Thêm prop expandable
}

export interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: string;
  title: string;
  inputType?: "number" | "text" | "select" | "date";
  options?: { label: string; value: string | number }[];
  record: any;
  index: number;
  children: React.ReactNode;
  onSave: (record: any) => void;
  onCancel: () => void;
}
export interface FormPopupProps {
  content?: string | null;
  open?: boolean;
  title?: string;
  columns: IColumn[] | [];
  initialValues?: any;
  onSubmit: (values: any) => void;
  onCancel?: () => void;
  loading?: boolean;
}

export interface IProject {
  id: string;
  name?: string| null;
  description?: string| null;
  start_date?: string| null;
  end_date?: string| null| undefined;   
  status?: number | string| null;
  priority?: number | undefined;   
  is_active?: number | undefined; 
  tasks?: ITask[] | any[];
  duration_days?: string| null;
  project_member?: IProjectMember[] | null;
  project_module ?: IModule[] | null;
}

export interface ITask {
  id: string;
  project_id?: string | null;
  name?: string | null;
  description?: string | null;
  priority?: number | null;        
  status?: string | null;         
  percent_complete?: number;
  start_date?: string | null;         
  expected_end_date?: string | null;  
  actual_end_date?: string | null;
  is_active?: boolean;
  is_deleted?: boolean;
  module?: IModule[] | [] | undefined;
  task_member?: ITaskMember[] | [];
}

export interface ITaskMember {
  id: string;
  task_id?: string | null;
  employee_id?: string | null;
  full_name?: string | null;
  position?: IPosition[] | [];
  assigned_date?: string | null;
}
export interface IPosition {
  id: string;
  project_id?: string | null;
  name?: string | null;
  description?: string | null;
  status?: string | null;
  created_at?: string | null;
  is_active?: boolean | undefined;
}

export interface IProjectMember {
  project_id: string;
  employee_id?: string | null;
  full_name?: string | null;
  joined_date?: string | null;
  left_date?: string | null;
  role?: string | null;
}

export interface IModule {
  id: string | null;
  project_id?: string | null;
  name?: string | null;
  description?: string | null;
  status?: string | null;
  priority?: number;
  created_at?: string | null;
  is_active?: boolean | undefined;
}