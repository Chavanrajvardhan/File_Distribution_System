import React, { isValidElement, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/joy/Alert";
import IconButton from "@mui/joy/IconButton";
import Typography from "@mui/joy/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import ReportIcon from "@mui/icons-material/Report";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

const Registration = () => {
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    role: "",
    center_id: "",
    pc_id: "",
    password: "",
  });

  const navigate = useNavigate();

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
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 1000);
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
    const isValid = true;

    if (!formData.first_name) {
      showAlert("error", "First name is required.");
      isValid = false;
    } else if (!formData.middle_name) {
      showAlert("error", "Middle name is required.");
      isValid = false;
    } else if (!formData.last_name) {
      showAlert("error", "Last name is required.");
      isValid = false;
    }

    if (!formData.email) {
      showAlert("error", "Email is required.");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showAlert("error", "Invalid email address.");
      isValid = false;
    }

    if (!formData.center_id) {
      showAlert("error", "Center ID is required.");
      isValid = false;
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.center_id)) {
      showAlert("error", "Center ID must be alphanumeric.");
      isValid = false;
    }
    if (!formData.pc_id) {
      showAlert("error", "PC ID is required.");
      isValid = false;
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.pc_id)) {
      showAlert("error", "PC ID must be alphanumeric.");
      isValid = false;
    }

    if (!formData.password) {
      showAlert("error", "Password is required.");
      isValid = false;
    } else if (
      !/(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}/.test(
        formData.password
      )
    ) {
      showAlert(
        "error",
        "Password must be at least 8 characters long and contain at least one letter, one number, and one special character."
      );
      isValid = false;
    }

    return isValid;
  };

  const capitalizeName = (name) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateInputs()) return;

    const formattedData = {
      ...formData,
      first_name: capitalizeName(formData.first_name),
      middle_name: formData.middle_name
        ? capitalizeName(formData.middle_name)
        : "",
      last_name: capitalizeName(formData.last_name),
    };

    try {
      const response = await axios.post("/api/users/register", formattedData, {
        headers: { "Content-Type": "application/json" },
      });
      showAlert("success", response.data.message);
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
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
      <div className="max-w-lg mx-auto mt-6 p-6 bg-cardColor border border-white-300 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-white text-center mb-4">
          User Registration
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {["first_name", "middle_name", "last_name"].map((field) => (
              <div key={field}>
                <input
                  type="text"
                  name={field}
                  placeholder={field
                    .replace("_", " ")
                    .replace(/^\w/, (c) => c.toUpperCase())}
                  value={formData[field]}
                  onChange={handleInputChange}
                  className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring focus:ring-blue-300"
                />
              </div>
            ))}
          </div>

          {/* Email */}
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>

          {/* Role */}
          <div>
            <label className="text-md font-medium text-white">Role:</label>
            <div className="flex gap-4 mt-2">
              {["Sender", "Receiver", "SenderReceiver"].map((role) => (
                <label key={role} className="flex items-center text-white">
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={formData.role === role}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  {role}
                </label>
              ))}
            </div>
          </div>

          {/* Center ID */}
          <div>
            <input
              type="text"
              name="center_id"
              placeholder="Center ID"
              value={formData.center_id}
              onChange={handleInputChange}
              className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>

          {/* PC ID */}
          <div>
            <input
              type="text"
              name="pc_id"
              placeholder="PC ID"
              value={formData.pc_id}
              onChange={handleInputChange}
              className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>

          {/* Password */}
          <div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-center gap-4 items-center">
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Register
            </button>
            <button
              type="button"
              onClick={() =>
                setFormData({
                  first_name: "",
                  middle_name: "",
                  last_name: "",
                  email: "",
                  role: "",
                  center_id: "",
                  pc_id: "",
                  password: "",
                })
              }
              className="px-6 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded"
            >
              Clear
            </button>
          </div>
        </form>
        <p className="text-center mt-4 text-white">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/")}
            className="text-orange-500 hover:underline"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default Registration;
