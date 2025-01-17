import React, { useState, useEffect } from "react";
import { useAuth } from "../context/Authcontext";
import axios from "axios";
 
const DownloadFiles = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [bulkDownloading, setBulkDownloading] = useState(false); // State for bulk download status
 
  useEffect(() => {
    if (user) {
      setUserId(user.user_id);
    }
  }, [user]);
 
  useEffect(() => {
    const fetchFiles = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        const response = await axios.post(`/api/file/availableToDownload`);
 
        if (response.data.success) {
          setFiles(response.data.data);
        } else {
          console.error(response.data.message);
        }
      } catch (error) {
        console.error("Error fetching files:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [userId]);
 
  const handleDownload = async (file) => {
    if (file.file_url) {
      try {
        const response = await fetch(file.file_url);
        const blob = await response.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", file.file_name || "download.txt");
        link.click();
        URL.revokeObjectURL(link.href);
      } catch (error) {
        console.error(`Error downloading file ${file.file_name}:`, error);
      }
    } else {
      console.error("File is not available for download or missing URL.");
    }
  };
 
  const handleDownloadAll = async () => {
    setBulkDownloading(true);
    try {
      for (const file of files) {
        if (file.availabilityStatus === "Available") {
          await handleDownload(file); // Use the existing download function
        }
      }
    } catch (error) {
      console.error("Error during bulk download:", error);
    } finally {
      setBulkDownloading(false);
    }
  };
 
  const bytesToMB = (bytes) => {
    const MB = 1024 * 1024;
    return (bytes / MB).toFixed(6);
  };
 
  return (
    <div className="px-6 py-4 rounded-3xl bg-cardColor overflow-hidden min-h-screen">
      <div className="p-2 sticky top-0 z-10 bg-cardColor pb-4 flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Download Files
        </h2>
        {files.length > 0 && (
          <button
            onClick={handleDownloadAll}
            disabled={bulkDownloading || files.every((file) => file.availabilityStatus !== "Available")}
            className={`py-2 px-4 rounded text-white ${
              bulkDownloading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {bulkDownloading ? "Downloading..." : "Download All"}
          </button>
        )}
      </div>
 
      {loading ? (
        <div className="text-white text-center">Loading files...</div>
      ) : (
        <div className="max-h-[80vh] overflow-y-auto rounded-lg">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-gray-700 text-white sticky top-0">
                <th className="p-2 text-center font-semibold">File Name</th>
                <th className="p-2 text-center font-semibold">Sender</th>
                <th className="p-2 text-center font-semibold">Size (MB)</th>
                <th className="p-2 text-center font-semibold">Upload Date</th>
                <th className="p-2 text-center font-semibold">Availability Time</th>
                <th className="p-2 text-center font-semibold">Status</th>
                <th className="p-2 text-center font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {files.length > 0 ? (
                files.map((file) => (
                  <tr
                    key={file.file_id}
                    className="border-b last:border-0 hover:bg-gray-800"
                  >
                    <td className="px-6 py-4 text-white">{file.file_name}</td>
                    <td className="px-6 py-4 text-white">{file.sender_name}</td>
                    <td className="px-6 py-4 text-white">
                      {bytesToMB(file.file_size)}{" "}
                    </td>
                    <td className="px-6 py-4 text-white">{file.created_at}</td>
                    <td className="px-6 py-4 text-white">{file.from_time} - {file.to_time}</td>
                    <td
                      className={`px-6 py-4 font-medium ${
                        file.availabilityStatus === "Available"
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {file.availabilityStatus}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDownload(file)}
                        disabled={file.availabilityStatus !== "Available"}
                        className={`py-2 px-4 rounded text-white ${
                          file.availabilityStatus === "Available"
                            ? "bg-blue-500 hover:bg-blue-600"
                            : "bg-gray-400 cursor-not-allowed"
                        }`}
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center text-white py-4 font-semibold"
                  >
                    No files available for download.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
 
export default DownloadFiles;
 