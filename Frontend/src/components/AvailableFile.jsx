import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/Authcontext.jsx";
import Select from "react-select";
import Alert from "@mui/joy/Alert";
import IconButton from "@mui/joy/IconButton";
import Typography from "@mui/joy/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import ReportIcon from "@mui/icons-material/Report";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

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
  const [availability, setAvailability] = useState({
    fromTime: "",
    toTime: "",
  });
  const [errors, setErrors] = useState("");
  const [showAvailability, setShowAvailability] = useState(false);

  const optionsRef = useRef(null);
  const [alert, setAlert] = useState({
    show: false,
    type: "success",
    message: "",
  });

  const showAlert = (type, message) => {
    setAlert({
      show: true,
      type,
      message,
    });
    setTimeout(() => setAlert({ show: false, type: "", message: "" }), 5000);
  };

  const AlertComponent = ({ type, message, onClose }) => {
    const alertProps = {
      success: {
        icon: <CheckCircleIcon />,
        color: "success",
      },
      error: {
        icon: <ReportIcon />,
        color: "danger",
      },
      warning: {
        icon: <WarningIcon />,
        color: "warning",
      },
    }[type] || { icon: <InfoIcon />, color: "neutral" };

    return (
      <Alert
        sx={{
          display: "flex", // Flex container for centering
          justifyContent: "center", // Center horizontally
          alignItems: "center", // Center vertically
          position: "fixed", // Fixed position to remain visible
          top: "40px", // Move to the center vertically
          left: "50%", // Move to the center horizontally
          transform: "translate(-50%, -50%)", // Offset by half the width and height
          zIndex: 9999, // Ensure it stays on top
          maxWidth: "400px",
        }}
        startDecorator={alertProps.icon}
        variant="soft"
        color={alertProps.color}
        endDecorator={
          <IconButton variant="soft" color={alertProps.color} onClick={onClose}>
            <CloseRoundedIcon />
          </IconButton>
        }
      >
        <div>
          <Typography level="body-sm" color={alertProps.color}>
            {message}
          </Typography>
        </div>
      </Alert>
    );
  };

  // console.log(availability.fromTime, availability.toTime);
  // console.log(selectedDateTime);
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
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleFileUpload = async (e) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles.length) return;

    const formData = new FormData();
    for (const file of selectedFiles) {
      formData.append("file", file);
    }

    try {
      const response = await axios.post("/api/file/uploadFile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        const newFiles = response.data.data;
        setFiles((prev) => [...prev, ...newFiles.map((file) => file.data)]);
        showAlert("success", "Files uploaded successfully!");
      } else {
        showAlert("error", "Failed to upload files.");
      }
    } catch (error) {
      showAlert("error", "Error uploading files. Please try again.");
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
      showAlert("error", "User not found.");
      return;
    }

    try {
      let fileIdsToDelete = multiSelectMode
        ? selectedFiles
        : fileId
        ? [fileId]
        : [];

      if (fileIdsToDelete.length === 0) {
        showAlert("warning", "No files selected for deletion.");
        return;
      }

      const fileIdsString = fileIdsToDelete.join(",");
      const response = await axios.post(
        `/api/file/deleteFile/${fileIdsString}`
      );

      if (response.data.success) {
        setFiles((prev) =>
          prev.filter((file) => !fileIdsToDelete.includes(file.file_id))
        );
        if (multiSelectMode) setSelectedFiles([]);
        showAlert("success", "File(s) deleted successfully!");
      } else {
        showAlert("error", "Failed to delete file(s).");
      }
    } catch (error) {
      showAlert("error", "Error deleting file(s). Please try again.");
    }
  };

  const handleShare = async () => {
    if (!selectedReceivers.length || !selectedFiles.length) {
      showAlert("warning", "Please select at least one file and one receiver.");
      return;
    }

    const filesToShare = multiSelectMode ? selectedFiles : [selectedFiles[0]];
    const receiverIds = selectedReceivers.map((receiver) => receiver.value);

    try {
      const endpoint =
        availability.fromTime && availability.toTime
          ? "/api/rule/withTimeBound"
          : selectedDateTime
          ? "/api/rule/scheduleFiles"
          : "/api/file/shareFile";

      const payload = {
        receiverids: receiverIds,
        file_url: filesToShare.map(
          (fileId) => files.find((f) => f.file_id === fileId).file_url
        ),
        file_name: filesToShare.map(
          (fileId) => files.find((f) => f.file_id === fileId).file_name
        ),
        file_size: filesToShare.map(
          (fileId) => files.find((f) => f.file_id === fileId).file_size
        ),
        resource_type: filesToShare.map(
          (fileId) =>
            files.find((f) => f.file_id === fileId).resource_type || "unknown"
        ),
        format: filesToShare.map(
          (fileId) =>
            files.find((f) => f.file_id === fileId).format || "unknown"
        ),
        ...(availability.fromTime && availability.toTime
          ? {
              from_time: availability.fromTime,
              to_time: availability.toTime,
            }
          : {}),
        ...(selectedDateTime ? { schedule_time: selectedDateTime } : {}),
      };

      const response = await axios.post(endpoint, payload);

      if (response.data.success) {
        showAlert("success", response.data.message);
        setShowShareForm(false);
        setSelectedReceivers([]);
        setSelectedFiles([]);
        setAvailability({ fromTime: "", toTime: "" });
        setSelectedDateTime("");
      } else {
        showAlert("error", response.data.message);
      }
    } catch (error) {
      showAlert(
        "error",
        error.response?.data?.message ||
          "Failed to share file(s). Please try again."
      );
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
    <div className="px-6 py-4 rounded-3xl bg-cardColor  min-h-screen">
      {alert.show && (
        <AlertComponent
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ show: false, type: "", message: "" })}
        />
      )}
      <div className="sticky top-0 z-0">
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

        <div className="flex justify-between items-center overflow-y-auto p-3">
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
      </div>

      {/* grid */}
      {files.length > 0 ? (
        <div className="grid grid-cols-1  sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {files.map((file, index) => (
            <div
              key={index}
              className={`relative border rounded-lg shadow-md bg-gray-700 p-8 text-center hover:shadow-lg transition duration-300`}
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
                    onClick={() => {
                      setShowShareForm(true);
                      toggleFileSelection(file.file_id);
                    }}
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
                  Schedule Time for Share
                </label>
                <input
                  type="datetime-local"
                  onChange={(e) => {
                    setSelectedDateTime(e.target.value);
                  }}
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

              {/* Availability Section */}
              <div className="flex flex-col">
                <label
                  onClick={() => {
                    setShowAvailability(!showAvailability);
                  }}
                  className="cursor-pointer text-gray-700 underline mb-2 color-blue"
                >
                  Mention Availability of the File
                </label>

                {showAvailability && (
                  <div className="flex flex-col space-y-2">
                    <div className="flex flex-col">
                      <label className="text-gray-700">From Time</label>
                      <input
                        type="datetime-local"
                        onChange={(e) => {
                          setAvailability((prev) => ({
                            ...prev,
                            fromTime: e.target.value,
                          }));
                        }}
                        className="border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-gray-700">To Time</label>
                      <input
                        type="datetime-local"
                        onChange={(e) => {
                          setAvailability((prev) => ({
                            ...prev,
                            toTime: e.target.value,
                          }));
                        }}
                        className="border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Form Footer */}
            <div className="flex justify-between mt-6">
              <button
                onClick={handleShare}
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
