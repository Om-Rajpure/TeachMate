import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Timetable from './pages/Timetable';
import Lectures from './pages/Lectures';
import Attendance from './pages/Attendance';
import Syllabus from './pages/Syllabus';
import Marks from './pages/Marks';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';
import Resources from './pages/Resources';
import SelectSubject from './pages/SelectSubject';
import ManageStudents from './pages/ManageStudents';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected app routes */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="timetable" element={<Timetable />} />
        <Route path="lectures" element={<Lectures />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="syllabus" element={<Syllabus />} />
        <Route path="marks" element={<Marks />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="resources" element={<Resources />} />
        <Route path="students">
          <Route index element={<Navigate to="select-subject" replace />} />
          <Route path="select-subject" element={<SelectSubject />} />
          <Route path="manage" element={<ManageStudents />} />
        </Route>
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
