import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useAuth } from "../context/Authcontext"; //

const BinComponent = () => {
  const { user } = useAuth(); // Access user info from AuthContext
  const [deletedFiles, setDeletedFiles] = useState([]);

  // Fetch deleted files for the logged-in user
  useEffect(() => {
    const fetchDeletedFiles = async () => {
      try {
        const response = await axios.get(
          `/api/file/allDeletedFiles/${user.user_id}`
        );
        setDeletedFiles(response.data.data);
      } catch (error) {
        console.error("Error fetching deleted files:", error);
      } 
    };

    fetchDeletedFiles();
  }, [user]);

  // Restore file handler
  const handleRestore = async (fileId) => {
    if (!user.user_id) return;

    try {
      const response = await axios.post(`/api/file/RestoreFile/${fileId}`);
      setDeletedFiles((prev) => prev.filter((file) => file.file_id !== fileId));
      if (response.data.success) {
        alert("File restored successfully!");
        setDeletedFiles((prev) =>
          prev.filter((file) => file.file_id !== fileId)
        );
      } else {
        console.error("Error restoring file:", response.data.message);
        alert("Failed to restore file.");
      }
    } catch (error) {
      console.error("Error restoring file:", error);
      alert("Failed to restore file.");
    }
  };

  // Permanent delete handler
  const handleDeletePermanently = async (fileId) => {
    try {
      const response = await axios.delete(
        `/api/file/permanentDelete/${fileId}`
      );
      if (response.data.success) {
        alert("File deleted permanently!");
        setDeletedFiles(deletedFiles.filter((file) => file.file_id !== fileId));
      } else {
        console.error("Error deleting file:", response.data.message);
        alert("Failed to delete the file.");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Failed to delete the file from server.");
    }
  };

  
  return (
    <div className="px-6 py-4 rounded-3xl bg-cardColor overflow-hidden min-h-screen">
      <div className="flex flex-col text-white">
        {/* Header */}
        <div className="p-2 flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Deleted Files (Bin)</h2>
        </div>

        {/* Table */}
        <div className="max-h-screen overflow-y-auto rounded-lg">
          <table className="w-full border-collapse text-center">
            {/* Table Header */}
            <thead className="sticky top-0 bg-gray-700">
              <tr>
                <th className="p-2">File Name</th>
                <th className="p-2">Deleted Date</th>
                <th className="p-2">Deleted Time</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {deletedFiles.length > 0 ? (
                deletedFiles.map((file) => (
                  <tr
                    key={file.file_id}
                    className="border-b last:border-0 hover:bg-gray-800"
                  >
                    <td className="px-6 py-4">{file.file_name}</td>
                    <td className="px-6 py-4">{file.deletedDate}</td>
                    <td className="px-6 py-4">{file.deletedTime}</td>
                    <td className="px-6 py-4 flex gap-2 justify-center">
                      <button
                        onClick={() => handleRestore(file.file_id)}
                        className="bg-green-500 px-3 py-1 rounded hover:bg-green-600"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => handleDeletePermanently(file.file_id)}
                        className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-gray-400">
                    No deleted files found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BinComponent;
