// import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import EmployeeManager from "./page/Employee/employee";
import { ProjectDetail } from "./page/Projects/DetailProject";
import { ProjectManagement } from "./page/Projects/ProjectManagement";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ProjectManagement />}></Route>
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route
            path="employee-management"
            element={<EmployeeManager />}
          ></Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
