import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/Authcontext";

const Home1 = () => {
  const { userRole } = useAuth();
  const [fileStats, setFileStats] = useState({
    totalFilesAvailable: 0,
    totalFilesDownloaded: 0,
    totalFilesSent: 0,
  });

  // Fetch file statistics from the backend
  // useEffect(() => {
  //   const fetchFileStats = async () => {
  //     try {
  //       const response = await axios.get("http://localhost:5000/api/filestats");
  //       setFileStats(response.data);
  //     } catch (error) {
  //       console.error("Error fetching file stats:", error);
  //     }
  //   };
  //   fetchFileStats();
  // }, []);

  // Helper Function: Render a single card
  const renderCard = (title, count) => (
    <div className="w-full sm:w-1/3 px-4">
      <div className="bg-cardColor shadow-md rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-2xl font-bold text-blue-600">{count}</p>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">
        Welcome to the Dashboard
      </h1>
      <div className="flex flex-wrap -mx-4">
        {/* Cards for All Roles */}
        {userRole === "SenderReceiver" && (
          <>
            {renderCard("Total Files Available", fileStats.totalFilesAvailable)}
            {renderCard("Total Files Downloaded", fileStats.totalFilesDownloaded)}
            {renderCard("Total Files Sent", fileStats.totalFilesSent)}
          </>
        )}
        {/* Cards for Sender */}
        {userRole === "Sender" && (
          <>
            {renderCard("Total Files Available", fileStats.totalFilesAvailable)}
            {renderCard("Total Files Sent", fileStats.totalFilesSent)}
          </>
        )}
        {/* Cards for Receiver */}
        {userRole === "Receiver" && (
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
