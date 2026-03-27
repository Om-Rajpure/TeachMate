import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Timetable from './pages/Timetable';
import Lectures from './pages/Lectures';
import Attendance from './pages/Attendance';
import Syllabus from './pages/Syllabus';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="timetable" element={<Timetable />} />
        <Route path="lectures" element={<Lectures />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="syllabus" element={<Syllabus />} />
      </Route>
    </Routes>
  );
}

export default App;
