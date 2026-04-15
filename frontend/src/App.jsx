import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Report from './pages/Report';
import Operator from './pages/Operator';
import Login from './pages/Login';
import UnitDispatch from './pages/UnitDispatch';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/report" element={<Report />} />
        <Route path="/operator" element={<Operator />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dispatch/:vehicleId" element={<UnitDispatch />} />
        <Route path="/" element={<Navigate to="/report" replace />} />
      </Routes>
    </Router>
  );
}

export default App;