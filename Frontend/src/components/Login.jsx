import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/Authcontext.jsx";
import Alert from "@mui/joy/Alert";
import IconButton from "@mui/joy/IconButton";
import Typography from "@mui/joy/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import ReportIcon from "@mui/icons-material/Report";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const { login } = useAuth();

  const [alert, setAlert] = useState({
    show: false,
    type: "success",
    message: "",
  });

  const showAlert = (type, message) => {
    setAlert({
      show: true,
      type,
      message,
    });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 5000);
  };

  const AlertComponent = ({ type, message, onClose }) => {
    const alertProps = {
      success: {
        icon: <CheckCircleIcon />,
        color: "success",
      },
      error: {
        icon: <ReportIcon />,
        color: "danger",
      },
      warning: {
        icon: <WarningIcon />,
        color: "warning",
      },
    }[type] || { icon: <InfoIcon />, color: "neutral" };

    return (
      <Alert
        sx={{
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          position: "fixed",
          top: "40px", 
          left: "50%", 
          transform: "translate(-50%, -50%)",
          zIndex: 9999, 
          maxWidth: "400px",
        }}
        startDecorator={alertProps.icon}
        variant="soft"
        color={alertProps.color}
        endDecorator={
          <IconButton variant="soft" color={alertProps.color} onClick={onClose}>
            <CloseRoundedIcon />
          </IconButton>
        }
      >
        <div>
          <Typography level="body-sm" color={alertProps.color}>
            {message}
          </Typography>
        </div>
      </Alert>
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateInputs = () => {
    let valid = true;
    if (!formData.password) {
      showAlert("error", "Password is required.");
      valid = false;
    } else if (
      !/(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}/.test(
        formData.password
      )
    ) {
      showAlert(
        "error",
        "Password must be at least 8 characters long and contain at least one letter, one number, and one special character."
      );
      valid = false;
    }

    if (!formData.email) {
      showAlert("error", "Email is required.");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showAlert("error", "Invalid email address.");
      valid = false;
    }
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    try {
      const response = await axios.post("/api/users/login", formData);
      if (response.status === 200 && response.data.success) {
        const role = response.data.data.newLogedInUser.role;
        const user = response.data.data.newLogedInUser;
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("role", role);
        login(user);
   
      } else {
        showAlert("error", response.data.message || "Login failed!");
      }
    } catch (error) {
      console.error("Error:", error);
      showAlert("error", error.response?.data?.message);
    }
  };

  return (
    <div className="bg-customDark h-screen flex flex-col justify-center items-center">
      {alert.show && (
        <AlertComponent
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ show: false, type: "", message: "" })}
        />
      )}
      <div className="max-w-md w-full p-6 bg-cardColor border border-gray-200 rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold text-center mb-4 text-white">
          User Login
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-white"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-white"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
          </div>
          <div className="flex justify-center items-center">
            <button
              type="submit"
              className="w-2/4 bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition duration-300"
            >
              Login
            </button>
          </div>
        </form>
        <p className="mt-4 text-center text-sm text-white">
          New User?{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-orange-600 hover:underline"
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
