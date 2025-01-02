/*import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/Authcontext.jsx";
// import {login} from "./"*/

/*const Login = () => {
  // const [formData, setFormData] = useState({ email: "", password: "" });
  // const { setUserRole } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" }); 
  const { login } = useAuth(); // Access the login functionconst navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("/api/users/login", formData);
      console.log("Response:", response);
    
      if (response.status === 200 && response.data.success) {
        const role = response.data.data.newLogedInUser.role;
        const user = response.data.data.newLogedInUser
        localStorage.setItem("user",JSON.stringify(user))
        localStorage.setItem("role",role)
        // setUserRole(role);
        login(user)
        navigate("/dashboard");
      } else {
        alert(response.data.message || "Something went wrong!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert(error.response?.data?.message || "Login failed!");
    }
    
  };

  return (
    <div className="bg-customDark h-screen flex flex-col justify-center items-center">
      <div className="max-w-md w-full  p-6 bg-cardColor border border-gray-200 rounded-lg shadow-md">
      <h1 className="text-2xl font-semibold text-center mb-4 text-white">User Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-white">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
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

export default Login;*/



import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/Authcontext.jsx";
 
const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: "", password: "" });
  const { login } = useAuth();
 
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
 
    // Clear error message for the field being updated
    setErrors((prevErrors) => ({ ...prevErrors, [name]: "" }));
  };
 
  const validateInputs = () => {
    let valid = true;
    const newErrors = { email: "", password: "" };
 
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
        "Password must be at least 8 characters long, alphanumeric, and include one special character.";
      valid = false;
    }
 
    setErrors(newErrors);
    return valid;
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;
 
    try {
      const response = await axios.post("/api/users/login", formData);
      console.log("Response:", response);
 
      if (response.status === 200 && response.data.success) {
        const role = response.data.data.newLogedInUser.role;
        const user = response.data.data.newLogedInUser
        localStorage.setItem("user",JSON.stringify(user))
        localStorage.setItem("role",role)
        login(user);
        navigate("/dashboard");
      } else {
        alert(response.data.message || "Something went wrong!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert(error.response?.data?.message || "Login failed!");
    }
  };
 
  return (
    <div className="bg-customDark h-screen flex flex-col justify-center items-center">
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
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
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
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
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
 
 