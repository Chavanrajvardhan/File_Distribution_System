import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login";
import Registration from "./components/Registration";
import Dashboard from "./components/Dashboard";
import { AuthProvider, useAuth } from "./context/Authcontext";
import Home1 from "./components/Home1";
import AvailableFile from "./components/AvailableFile";
import Rules from "./components/Rules";
import Bin from "./components/Bin";
import DownloadFile from "./components/DownloadFile";

// PrivateRoute Component
const PrivateRoute = ({ element: Component }) => {
  const { user } = useAuth(); // Access user data from AuthContext
  return user ? Component : <Navigate to="/" replace />;
};

// PublicRoute Component
const PublicRoute = ({ element: Component }) => {
  const { user } = useAuth(); // Access user data from AuthContext
  return user ? <Navigate to="/dashboard/home" replace /> : Component;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicRoute element={<Login />} />} />
          <Route
            path="/register"
            element={<PublicRoute element={<Registration />} />}
          />

          {/* Private Routes */}
          <Route
            path="/dashboard"
            element={<PrivateRoute element={<Dashboard />} />}
          >
            <Route path="home" element={<PrivateRoute element={<Home1 />} />} />
            <Route
              path="available-files"
              element={<PrivateRoute element={<AvailableFile />} />}
            />
            <Route
              path="rules"
              element={<PrivateRoute element={<Rules />} />}
            />
            <Route path="bin" element={<PrivateRoute element={<Bin />} />} />
            <Route
              path="download-files"
              element={<PrivateRoute element={<DownloadFile />} />}
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
