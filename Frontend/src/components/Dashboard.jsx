import React, { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Home, Folder, Download, Rule, Delete, Menu, ChevronLeft } from "@mui/icons-material";
import { useAuth } from "../context/Authcontext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
 
const Dashboard = () => {
  const { userRole, logout } = useAuth();
  const storedUserData = localStorage.getItem("user");
  const userdata = JSON.parse(storedUserData);
  const navigate = useNavigate();
 
  const [isCollapsed, setIsCollapsed] = useState(false); // Sidebar collapse state
 
  const handleLogout = async () => {
    try {
      const response = await axios.post(
        "/api/users/logout",
        {},
        { withCredentials: true }
      );
      if (response.data.success) {
        logout();
        navigate("/");
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };
 
  const menuItems = {
    sender: [
      { text: "Home", icon: <Home />, link: "home" },
      { text: "Available Files", icon: <Folder />, link: "available-files" },
      { text: "Rules", icon: <Rule />, link: "rules" },
      { text: "Bin", icon: <Delete />, link: "bin" },
    ],
    receiver: [
      { text: "Home", icon: <Home />, link: "home" },
      { text: "Download Files", icon: <Download />, link: "download-files" },
    ],
    senderreceiver: [
      { text: "Home", icon: <Home />, link: "home" },
      { text: "Available Files", icon: <Folder />, link: "available-files" },
      { text: "Download Files", icon: <Download />, link: "download-files" },
      { text: "Rules", icon: <Rule />, link: "rules" },
      { text: "Bin", icon: <Delete />, link: "bin" },
    ],
  };
 
  const currentMenu = menuItems[userRole] || [];
 
  return (
    <div className="flex h-screen bg-customDark">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 bg-cardColor text-white flex flex-col justify-between p-4 transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Toggle Icon */}
        <div
          className="flex justify-end mb-6 cursor-pointer"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <span className="text-white">
            {isCollapsed ? <Menu fontSize="large"  /> : <ChevronLeft fontSize="large" />}
          </span>
        </div>
 
        {/* User Info */}
        {!isCollapsed && (
          <div className="text-center text-white text-lg font-bold mb-6">
            {userdata?.first_name}
          </div>
        )}
 
        {/* Navigation Menu */}
        <nav>
          <ul className="space-y-4">
            {currentMenu.map((item, index) => (
              <li key={index}>
                <NavLink
                  to={item.link}
                  className={({ isActive }) =>
                    `flex items-center gap-4 p-2 rounded transition-all duration-300 ${
                      isActive
                        ? "bg-orange-500 text-gray-100"
                        : "text-white hover:bg-orange-600"
                    }`
                  }
                >
                  {/* Icon */}
                  <span className="text-xl">{item.icon}</span>
                  {/* Text Label: Hidden when collapsed */}
                  {!isCollapsed && <span>{item.text}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
 
        {/* Logout Button */}
        {!isCollapsed && (
          <button
            className="bg-customDark text-black w-full p-2 rounded-lg text-gray-200 mt-4"
            onClick={handleLogout}
          >
            Log Out
          </button>
        )}
      </div>
 
      {/* Main Content Area */}
      <div
        className={`flex-1 bg-customDark transition-all duration-300 ${
          isCollapsed ? "ml-16" : "ml-60"
        } px-4 overflow-auto`}
      >
        <Outlet />
      </div>
    </div>
  );
};
 
export default Dashboard;
 
 