import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/Authcontext";

const Home1 = () => {
  const { userRole, user } = useAuth(); // User's role fetched from context
  const [userId, setUserId] = useState(null);
  const [fileStats, setFileStats] = useState({
    totalFilesAvailable: 0,
    totalFilesDownloaded: 0,
    totalFilesSent: 0,
  });

  useEffect(() => {
    if (user) {
      setUserId(user.user_id);
    }
  }, [user]);

  // Fetch files count based on user role
  useEffect(() => {
    const fetchFileStats = async () => {
      try {
        // Send the role dynamically to the backend
        const response = await axios.get(`/api/file/fileStatus`);
        setFileStats(response.data.data);
      } catch (error) {
        console.error("Error fetching file stats:", error);
      }
    };
    fetchFileStats();
  }, [userRole]); // Fetch stats whenever the userRole changes

  // Helper Function: Render a single card
  const renderCard = (title, count) => (
    <div className="w-full sm:w-1/3 px-4 mb-4">
      <div className="bg-gray-700 border shadow-md rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-2xl font-bold text-blue-500">{count}</p>
      </div>
    </div>
  );

  return (
    <div className="px-6 py-4 rounded-3xl bg-cardColor overflow-hidden  min-h-screen">
      <h1 className="p-2 text-2xl font-bold text-white mb-6">
        Welcome to the Dashboard
      </h1>
      <div className="flex flex-wrap -mx-4">
        {/* Cards for All Roles */}
        {userRole === "senderreceiver" && (
          <>
            {renderCard("Total Files Available", fileStats.totalFilesAvailable)}
            {renderCard(
              "Total Files Downloaded",
              fileStats.totalFilesDownloaded
            )}
            {renderCard("Total Files Sent", fileStats.totalFilesSent)}
          </>
        )}
        {/* Cards for Sender */}
        {userRole === "sender" && (
          <>
            {renderCard("Total Files Available", fileStats.totalFilesAvailable)}
            {renderCard("Total Files Sent", fileStats.totalFilesSent)}
          </>
        )}
        {/* Cards for Receiver */}
        {userRole === "receiver" && (
          <>
            {renderCard(
              "Total Files Downloaded",
              fileStats.totalFilesDownloaded
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home1;
