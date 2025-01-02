
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Registration from "./components/Registration";
import Dashboard from "./components/Dashboard";
import { AuthProvider } from "./context/Authcontext";
import Home1 from "./components/Home1";
import AvailableFile from "./components/AvailableFile";
import Rules from "./components/Rules";
import Bin from "./components/Bin";
import DownloadFile from "./components/DownloadFile";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Registration />} />

          <Route exact path="/dashboard" element={<Dashboard />}>
            <Route path="home" element={< Home1/>} />
            <Route path="available-files" element={<AvailableFile/>} />
            <Route path="rules" element={<Rules/>} />
            <Route path="bin" element={< Bin/>} />
            <Route path="download-files" element={<DownloadFile/>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;