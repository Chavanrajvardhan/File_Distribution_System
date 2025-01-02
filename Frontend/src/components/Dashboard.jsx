import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { Home, Folder, Download, Rule, Delete } from "@mui/icons-material";
import { useAuth } from "../context/Authcontext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const drawerWidth = "240px";

const Dashboard = () => {
  // const { userRole } = useAuth();
  const {user, userRole, logout} = useAuth()
  
  const storedUserData = localStorage.getItem("user")
  const userdata = JSON.parse(storedUserData)
  const navigate = useNavigate()


  const handleLogout = async () => {
    try {
      const response = await axios.post(
        "/api/users/logout",
        {},
        { withCredentials: true } // Ensure cookies are sent with the request
      );
      if (response.data.success) {
        // localStorage.removeItem("user");
        logout()
        navigate("/"); 
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };
  
  const menuItems = {
    sender: [
      { text: "Home", icon: <Home />, link: "/" },
      { text: "Available Files", icon: <Folder />, link: "/available-files" },
      { text: "Rules", icon: <Rule />, link: "/rules" },
      { text: "Bin", icon: <Delete />, link: "/bin" },
    ],
    receiver: [
      { text: "Home", icon: <Home />, link: "/" },
      { text: "Download Files", icon: <Download />, link: "/download-files" },
      { text: "Bin", icon: <Delete />, link: "/bin" },
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
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className="fixed inset-y-0 left-0 bg-cardColor text-white w-60 flex flex-col justify-between p-4"
        style={{ width: drawerWidth }}
      >
        {/* <div className="text-center text-white text-lg font-bold mb-6">UserName</div> */}
        <div className="text-center text-white text-lg font-bold mb-6">{userdata?.first_name}</div>
        <nav>
          <ul className="space-y-4">
            {currentMenu.map((item, index) => (
              <li key={index}>
             <NavLink
                  to={item.link}
                  className={({ isActive }) =>
                    `flex gap-4 items-center space-x-3 p-2 rounded transition-all duration-600 ${
                      isActive
                        ? "bg-orange-500 text-gray-100"
                        : "text-white hover:bg-orange-600"
                    }`
                  }
                >
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <button className="bg-customDark text-black w-full p-2 rounded-lg text-gray-200"
        onClick={handleLogout}
        >
          Log Out
        </button>
      </div>

      {/* Main Content Area */}
      <div
        className="flex-1 bg-customDark ml-60 p-6 overflow-auto"
        style={{ marginLeft: drawerWidth }}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;