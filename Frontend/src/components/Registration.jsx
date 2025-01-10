import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear the error for the field being updated
    setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
  };

  const validateInputs = () => {
    let valid = true;
    const newErrors = {};

    // Name validations
    if (!formData.first_name) {
      newErrors.first_name = "First name is required.";
      valid = false;
    }
    if (!formData.middle_name) {
      newErrors.middle_name = "Middle name is required.";
      valid = false;
    }
    if (!formData.last_name) {
      newErrors.last_name = "Last name is required.";
      valid = false;
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required.";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
      valid = false;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required.";
      valid = false;
    } else if (
      !/(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}/.test(
        formData.password
      )
    ) {
      newErrors.password =
        "Password must be at least 8 characters, alphanumeric, and include one special character.";
      valid = false;
    }

    // Center ID validation
    if (!formData.center_id) {
      newErrors.center_id = "Center ID is required.";
      valid = false;
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.center_id)) {
      newErrors.center_id = "Center ID must be alphanumeric.";
      valid = false;
    }

    // PC ID validation
    if (!formData.pc_id) {
      newErrors.pc_id = "PC ID is required.";
      valid = false;
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.pc_id)) {
      newErrors.pc_id = "PC ID must be alphanumeric.";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
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
      alert(response.data.message || "Registration successful!");
      navigate("/");
    } catch (error) {
      alert(error.response?.data?.message || "Something went wrong!");
    }
  };

  return (
    <div className="bg-customDark h-screen flex flex-col justify-center items-center">
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
                {errors[field] && (
                  <p className="text-red-500 text-sm">{errors[field]}</p>
                )}
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
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email}</p>
            )}
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
            {errors.role && (
              <p className="text-red-500 text-sm">{errors.role}</p>
            )}
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
            {errors.center_id && (
              <p className="text-red-500 text-sm">{errors.center_id}</p>
            )}
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
            {errors.pc_id && (
              <p className="text-red-500 text-sm">{errors.pc_id}</p>
            )}
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
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password}</p>
            )}
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
