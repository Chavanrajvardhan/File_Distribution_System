import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/Authcontext.jsx";
import Select from "react-select"; // Assuming you're using react-select for multi-select fields

function AvailableFile() {
  const { userRole, user } = useAuth();
  const [userId, setUserId] = useState(null);
  const [files, setFiles] = useState([]);
  const [receivers, setReceivers] = useState([]);
  const [rules, setRules] = useState([]);
  const [showOptions, setShowOptions] = useState(null);
  const [showShareForm, setShowShareForm] = useState(false);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedReceivers, setSelectedReceivers] = useState([]);
  const [selectedDateTime, setSelectedDateTime] = useState("");
  const [selectedRules, setSelectedRules] = useState([]);

  const optionsRef = useRef(null);

  // Set userId when user is available
  useEffect(() => {
    if (user) {
      setUserId(user.user_id);
    }
  }, [user]);

  // Fetch files data based on userId
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      try {
        const filesResponse = await axios.post(
          `/api/file/allUserFiles/${userId}`
        );
        if (filesResponse.data.data) {
          setFiles(filesResponse.data.data); // Update state with fetched files
        } else {
          console.error("No files found in response.");
        }

        const receiversResponse = await axios.get("/api/file/getAllReceivers");
        if (receiversResponse.data.data) {
          setReceivers(
            receiversResponse.data.data.map((receiver) => ({
              value: receiver.user_id,
              label: `${receiver.first_name} ${receiver.last_name}`,
            }))
          );
        } else {
          console.error("No receivers found in response.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [userId]);

  const openOptions = (index) => {
    setShowOptions((prev) => (prev === index ? null : index));
  };
  const closeOptions = () => setShowOptions(null);

  const toggleMultiSelectMode = () => {
    setMultiSelectMode(!multiSelectMode);
    setSelectedFiles([]); // Clear selected files when toggling mode
  };

  const toggleFileSelection = (fileId) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId)
        ? prev.filter((file_id) => file_id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleFileUpload = async (e) => {
    const selectedFiles = e.target.files;

    if (!selectedFiles.length) {
      return; // No files selected
    }

    const formData = new FormData();
    for (const file of selectedFiles) {
      formData.append("file", file);
    }

    try {
      const response = await axios.post("/api/file/uploadFile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        const newFiles = response.data.data; // Assuming response returns an array of uploaded files
        setFiles((prev) => [...prev, ...newFiles.map((file) => file.data)]); // Add new files to the UI
      } else {
        console.error("Error uploading files:", response.data.message);
        alert("Failed to upload files.");
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Failed to upload files.");
    }
  };

  const handleView = async (fileUrl) => {
    try {
      if (!fileUrl) {
        throw new Error("File URL not found in response.");
      }
      window.open(fileUrl, "_blank"); // Open the file in a new tab
    } catch (error) {
      console.error("Error viewing file:", error.message || error);
      alert("Failed to view the file. Please try again.");
    }
  };

  // const handleViewGoogleDocFile = (fileUrl) => {
  //   const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
  //     fileUrl
  //   )}&embedded=true`;
  //   window.open(googleViewerUrl, "_blank");
  // };

  const handleDelete = async (fileId = null) => {
    if (!userId) {
      alert("User not found.");
      return;
    }

    try {
      let fileIdsToDelete = [];

      // If multi-select mode is on, delete selected files
      if (multiSelectMode) {
        if (selectedFiles.length === 0) {
          alert("No files selected for deletion.");
          return;
        }
        fileIdsToDelete = selectedFiles;
      }
      // If multi-select mode is off, delete the single file
      else if (fileId) {
        fileIdsToDelete = [fileId];
      } else {
        alert("File not found for deletion.");
        return;
      }

      // Join file IDs into a comma-separated string for the backend
      const fileIdsString = fileIdsToDelete.join(",");

      // Send delete request to the backend
      const response = await axios.post(
        `/api/file/deleteFile/${fileIdsString}`
      );

      if (response.data.success) {
        alert("File(s) deleted successfully!");

        // Remove deleted files from UI
        setFiles((prev) =>
          prev.filter((file) => !fileIdsToDelete.includes(file.file_id))
        );

        // Clear selected files if in multi-select mode
        if (multiSelectMode) {
          setSelectedFiles([]);
        }
      } else {
        console.error("Error deleting file(s):", response.data.message);
        alert("Failed to delete file(s).");
      }
    } catch (error) {
      console.error("Error deleting file(s):", error);
      alert("Failed to delete file(s).");
    }
  };

  // Handle clicks outside of the options menu to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        closeOptions();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="px-6 py-4 rounded-3xl bg-cardColor overflow-hidden min-h-screen">
      <div className="flex justify-between items-center">
        <h2 className="p-2 text-2xl font-bold mb-6 text-white">
          Available Files
        </h2>
        <button className="px-4 py-2 rounded bg-green-500 text-white">
          <label htmlFor="file-upload" className="cursor-pointer">
            Add New File
          </label>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            multiple // Add the 'multiple' attribute
          />
        </button>
      </div>

      <div className="mb-4 flex justify-between">
        {files.length > 1 && (
          <button
            onClick={toggleMultiSelectMode}
            className={`px-4 py-2 rounded ${
              multiSelectMode ? "bg-red-500" : "bg-blue-500"
            } text-white`}
          >
            {multiSelectMode ? "Cancel Multi-Select" : "Enable Multi-Select"}
          </button>
        )}
        {multiSelectMode && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowShareForm(true)}
              disabled={selectedFiles.length === 0}
              className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600"
            >
              Share Selected
            </button>
            <button
              onClick={() => handleDelete()}
              disabled={selectedFiles.length === 0}
              className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
            >
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* grid */}
      {files.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {files.map((file, index) => (
            <div
              key={index}
              className={`relative border rounded-lg shadow-md bg-gray-700 p-8 text-center hover:shadow-lg transition duration-300 ${
                selectedFiles.includes(file.file_id) ? "bg-blue-800" : ""
              }`}
              style={{ width: "200px", height: "100px" }}
            >
              {multiSelectMode && (
                <input
                  type="checkbox"
                  checked={selectedFiles.includes(file.file_id)}
                  onChange={() => toggleFileSelection(file.file_id)}
                  className="absolute top-2 left-2 w-5 h-5"
                />
              )}
              <div
                className="text-lg font-semibold text-white truncate overflow-hidden"
                style={{ whiteSpace: "nowrap" }}
                title={file.file_name}
              >
                {file.file_name}
              </div>
              {!multiSelectMode && (
                <button
                  onClick={() => openOptions(file.file_id)}
                  className="absolute top-2 right-2 text-white hover:text-gray-200"
                >
                  &#x22EE;
                </button>
              )}
              {showOptions === file.file_id && (
                <div
                  ref={optionsRef}
                  className="absolute top-10 right-2 bg-white border rounded-lg shadow-md z-50 overflow-hidden "
                >
                  <button
                    onClick={() => setShowShareForm(true)}
                    className="block px-4 py-2 hover:bg-gray-100 w-full text-left text-green-500"
                  >
                    Share
                  </button>
                  <button
                    onClick={() => handleView(file.file_url)} // Placeholder for view action
                    className="block px-4 py-2 hover:bg-gray-100 w-full text-left text-blue-500"
                  >
                    View
                  </button>
                  <button
                    className="block px-4 py-2 hover:bg-gray-100 w-full text-left text-red-500"
                    onClick={() => handleDelete(file.file_id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-400 text-center mt-8">No files found.</div>
      )}

      {/* Share Form Modal */}
      {showShareForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 text-center">
              Share File
            </h3>
            <div className="space-y-4">
              {/* Receiver Multi-Select */}
              <div>
                <Select
                  options={receivers}
                  isMulti
                  onChange={setSelectedReceivers}
                  placeholder="Select Receivers..."
                />
              </div>
              {/* Date and Time Picker */}
              <div className="flex flex-col">
                <label className="text-gray-700 underline mb-2">
                  Schedule Time for Upload
                </label>
                <input
                  type="datetime-local"
                  onChange={(e) => setSelectedDateTime(e.target.value)}
                  className="border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {/* Rule Multi-Select */}
              <div>
                <Select
                  options={rules}
                  isMulti
                  onChange={setSelectedRules}
                  placeholder="Select Rules..."
                />
              </div>
            </div>
            {/* Form Footer */}
            <div className="flex justify-between mt-6">
              <button
                // onClick={handleShare}
                className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600"
              >
                Share
              </button>
              <button
                onClick={() => setShowShareForm(false)}
                className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AvailableFile;
