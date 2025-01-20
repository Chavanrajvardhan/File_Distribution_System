import React, { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import {
  Home,
  Folder,
  Download,
  Rule,
  Delete,
  Menu,
  ChevronLeft,
} from "@mui/icons-material";
import { useAuth } from "../context/Authcontext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ExitToAppOutlinedIcon from "@mui/icons-material/ExitToAppOutlined";
 
const Dashboard = () => {
  const { userRole, logout } = useAuth();
  const storedUserData = localStorage.getItem("user");
  const userdata = JSON.parse(storedUserData);
  const navigate = useNavigate();
 
  const [isCollapsed, setIsCollapsed] = useState(false); // Sidebar collapse state
  const [showLogoutModal, setShowLogoutModal] = useState(false); // Logout confirmation modal state
 
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
        className={`fixed rounded-3xl inset-y-0 left-0 bg-cardColor text-white flex flex-col justify-between py-6 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Toggle Icon */}
        <div
          className="flex justify-end mb-6 px-2 cursor-pointer"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <span className="text-white">
            {isCollapsed ? <Menu fontSize="large" /> : <ChevronLeft fontSize="large" />}
          </span>
        </div>
 
        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <img
              src={`https://ui-avatars.com/api/?name=${userdata?.first_name}+${userdata?.last_name}&background=32CD32&color=fff`}
              alt="Avatar"
              className="w-12 h-12 rounded-full cursor-pointer hover:opacity-90"
              title={`${userdata?.first_name} ${userdata?.last_name}\n${userdata?.email}`}
            />
            {isCollapsed && (
              <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-white text-black text-sm p-2 rounded shadow-lg whitespace-nowrap z-10 opacity-0 hover:opacity-100 transition-opacity">
                <p className="font-bold">{`${userdata?.first_name} ${userdata?.last_name}`}</p>
                <p>{userdata?.email}</p>
              </div>
            )}
          </div>
        </div>
 
        {/* Welcome Message */}
        {!isCollapsed && (
          <div className="text-center mb-6">
            <div className="text-lg font-bold text-red-500">WELCOME</div>
            <div className="text-sm font-semibold">{userdata?.first_name}</div>
          </div>
        )}
 
        {/* Navigation Menu */}
        <div className="flex-1 flex flex-col items-center">
          <ul className="space-y-4 w-full">
            {currentMenu.map((item, index) => (
              <li key={index}>
                <NavLink
                  to={item.link}
                  className={({ isActive }) =>
                    `flex items-center gap-4 p-2 rounded transition-all duration-300 ease-in-out ${
                      isActive
                        ? "bg-orange-500 text-gray-100"
                        : "text-white hover:bg-orange-600"
                    } ${isCollapsed ? "justify-center" : ""}`
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
        </div>
 
        {/* Logout Button */}
        <button
          className={` p-2 rounded-lg text-gray-200 flex items-center justify-center gap-2 hover:bg-red-700 transition-colors duration-300 ${
            isCollapsed ? "justify-center" : ""
          }`}
          onClick={() => setShowLogoutModal(true)}
        >
          <ExitToAppOutlinedIcon />
          {!isCollapsed && <span>Log Out</span>}
        </button>
      </div>
 
      {/* Main Content Area */}
      <div
        className={`flex-1 bg-customDark transition-all duration-300 ease-in-out ${
          isCollapsed ? "ml-16" : "ml-60"
        } px-4 overflow-auto`}
      >
        <Outlet />
      </div>
 
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">Confirm Logout</h2>
            <p className="mb-6">Are you sure you want to log out?</p>
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 bg-gray-300 rounded-md"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-300"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
 
export default Dashboard;