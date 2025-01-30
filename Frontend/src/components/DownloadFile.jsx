import React, { useState, useEffect } from "react";
import { useAuth } from "../context/Authcontext";
import axios from "axios";
import { FaSort, FaCheck, FaTimes } from "react-icons/fa";

const DownloadFiles = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [currentSortKeys, setCurrentSortKeys] = useState([]);
  const [bulkDownloading, setBulkDownloading] = useState(false);

  // Filter states
  const [sortKey, setSortKey] = useState("");
  const [sortedFiles, setSortedFiles] = useState([]);

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
          setSortedFiles(response.data.data);
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
          await handleDownload(file);
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

  // Handle Sorting
  const handleSort = (key) => {
    let sorted = [...files];
    const activeSortKeys = new Set(currentSortKeys);

    if (activeSortKeys.has(key)) {
      activeSortKeys.delete(key);
    } else {
      activeSortKeys.add(key);
    }

    // Perform multi-level sorting based on activeSortKeys order
    sorted.sort((a, b) => {
      for (const activeKey of activeSortKeys) {
        let comparison = 0;
        switch (activeKey) {
          case "name":
            comparison = a.file_name.localeCompare(b.file_name);
            break;
          case "size":
            comparison = a.file_size - b.file_size;
            break;
          case "availability":
            comparison = a.availabilityStatus.localeCompare(
              b.availabilityStatus
            );
            break;
          case "date": // Default sorting by date
            comparison = new Date(a.created_at) - new Date(b.created_at);
            break;
          default:
            break;
        }
        // If current sorting key provides a difference, use it
        if (comparison !== 0) return comparison;
      }
      return 0; // If all keys are equal
    });

    setSortedFiles(sorted);
    setCurrentSortKeys([...activeSortKeys]); // Update active sort keys
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
            disabled={
              bulkDownloading ||
              files.every((file) => file.availabilityStatus !== "Available")
            }
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
      {/* Filters Section */}
      <div className="mb-4 flex justify-end space-x-4">
        <button
          onClick={() => handleSort("name")}
          className={`py-2 px-4 rounded text-white flex items-center space-x-2 ${
            currentSortKeys.includes("name")
              ? "bg-orange-600"
              : "bg-gray-600 hover:bg-gray-700"
          }`}
        >
          <FaSort />
          <span>Sort by Name</span>
        </button>
        <button
          onClick={() => handleSort("size")}
          className={`py-2 px-4 rounded text-white flex items-center space-x-2 ${
            currentSortKeys.includes("size")
              ? "bg-orange-600"
              : "bg-gray-600 hover:bg-gray-700"
          }`}
        >
          <FaSort />
          <span>Sort by Size</span>
        </button>
        <button
          onClick={() => handleSort("availability")}
          className={`py-2 px-4 rounded text-white flex items-center space-x-2 ${
            currentSortKeys.includes("availability")
              ? "bg-orange-600"
              : "bg-gray-600 hover:bg-gray-700"
          }`}
        >
          {currentSortKeys.includes("availability") ? <FaCheck /> : <FaTimes />}
          <span>Sort by Availability</span>
        </button>
      </div>
      ;
      {loading ? (
        <div className="text-white text-center">Loading files...</div>
      ) : (
        <div className="max-h-[70vh] overflow-y-auto rounded-lg">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-gray-700 text-white sticky top-0">
                <th className="p-2 text-center font-semibold">File Name</th>
                <th className="p-2 text-center font-semibold">Sender</th>
                <th className="p-2 text-center font-semibold">Size (MB)</th>
                <th className="p-2 text-center font-semibold">Upload Date</th>
                <th className="p-2 text-center font-semibold">
                  Availability Time
                </th>
                <th className="p-2 text-center font-semibold">Status</th>
                <th className="p-2 text-center font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedFiles.length > 0 ? (
                sortedFiles.map((file) => (
                  <tr
                    key={file.file_id}
                    className="border-b last:border-0 hover:bg-gray-800"
                  >
                    <td
                      className="px-6 py-4 truncate text-white max-w-[140px] overflow-hidden whitespace-nowrap text-ellipsis cursor-pointer"
                      title={file.file_name}
                    >
                      {file.file_name}
                    </td>

                    <td
                      className="px-6 py-4 text-white truncate max-w-[140px] overflow-hidden whitespace-nowrap text-ellipsis cursor-pointer"
                      title={file.sender_name}
                    >
                      {file.sender_name}
                    </td>
                    <td className="px-6 py-4 text-white">
                      {bytesToMB(file.file_size)}{" "}
                    </td>
                    {/* <td className="px-6 py-4 text-white">{file.created_at}</td> */}
                    <td
                      className="px-6 py-4 truncate text-white max-w-[140px] overflow-hidden whitespace-nowrap text-ellipsis cursor-pointer"
                      title={file.created_at}
                    >
                      {file.created_at}
                    </td>

                    <td
                      className="px-6 py-4 truncate text-white max-w-[140px] overflow-hidden whitespace-nowrap text-ellipsis cursor-pointer"
                      title={
                        file.from_time && file.to_time
                          ? `Available from ${file.from_time} to ${file.to_time}`
                          : file.from_time
                          ? `Available after ${file.from_time}`
                          : file.to_time
                          ? `Available until ${file.to_time}`
                          : "Available anytime"
                      }
                    >
                      {file.from_time && file.to_time
                        ? `${file.from_time} - ${file.to_time}`
                        : file.from_time
                        ? `${file.from_time} - Anytime`
                        : file.to_time
                        ? `Anytime - ${file.to_time}`
                        : "Anytime"}
                    </td>

                    <td
                      className={`px-6 py-4 font-medium ${
                        file.availabilityStatus === "Available"
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {file.availabilityStatus}
                    </td>
                    <td className="px-4 py-4">
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
                    colSpan="7"
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
