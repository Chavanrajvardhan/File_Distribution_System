import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/Authcontext.jsx";
import Multiselect from "multiselect-react-dropdown";
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
  const [selectedFromTime, setSelectedFromTime] = useState("");
  const [selectedToTime, setSelectedToTime] = useState("");
  const [showAvailability, setShowAvailability] = useState(false);
  const optionsRef = useRef(null);
  const receiverDropdownRef = useRef(null);
  const ruleDropdownRef = useRef(null);
  const [receiverDropdownOpen, setReceiverDropdownOpen] = useState(false);
  const [rulesDropdownOpen, setRulesDropdownOpen] = useState(false);
  const [sharingMode, setSharingMode] = useState("none");

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
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "fixed",
          top: "40px",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
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
          setFiles(filesResponse.data.data);
        } else {
          console.error("No files found in response.");
        }

        const receiversResponse = await axios.get("/api/file/getAllReceivers");
        if (receiversResponse.data.data) {
          setReceivers(
            receiversResponse.data.data.map(
              (receiver) =>
                `${receiver.user_id}. ${receiver.first_name} ${receiver.last_name}`
            )
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

  const handleRecipientsSelect = (selectedList) => {
    setSelectedReceivers(selectedList);
  };

  const openOptions = (index) => {
    setShowOptions((prev) => (prev === index ? null : index));
  };
  const closeOptions = () => setShowOptions(null);

  const toggleMultiSelectMode = () => {
    setMultiSelectMode(!multiSelectMode);
    setSelectedFiles([]);
  };

  const toggleFileSelection = (file) => {
    setSelectedFiles((prev) =>
      prev.some((selectedFile) => selectedFile.file_id === file.file_id)
        ? prev.filter((selectedFile) => selectedFile.file_id !== file.file_id)
        : [...prev, file]
    );
  };

  const handleFileUpload = async (e) => {
    const selectedFiles = e.target.files;

    if (!selectedFiles.length) {
      return;
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
        const newFiles = response.data.data;
        setFiles((prev) => [...prev, ...newFiles.map((file) => file.data)]);
        showAlert("success", "Files uploaded successfully!");
      } else {
        console.error("Error uploading files:", response.data.message);
        showAlert("error", "Failed to upload files.");
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      showAlert("error", "Failed to upload files.");
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
      showAlert("error", "Failed to view the file. Please try again.");
    }
  };

  const handleDelete = async (fileId = null) => {
    if (!userId) {
      showAlert("error", "User not found.");
      return;
    }

    try {
      let fileIdsToDelete = [];

      // If multi-select mode is on, delete selected files
      if (multiSelectMode) {
        if (selectedFiles.length === 0) {
          showAlert("error", "No files selected for deletion.");
          return;
        }
        fileIdsToDelete = selectedFiles.map((file) => file.file_id);
      }
      // If multi-select mode is off, delete the single file
      else if (fileId) {
        fileIdsToDelete = [fileId];
      } else {
        showAlert("error", "File not found for deletion.");
        return;
      }
      // Join file IDs into a comma-separated string for the backend
      const fileIdsString = fileIdsToDelete.join(",");

      // Send delete request to the backend
      const response = await axios.post(
        `/api/file/deleteFile/${fileIdsString}`
      );

      if (response.data.success) {
        showAlert("success", "File(s) deleted successfully!");

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
        showAlert("error", "Failed to delete file(s).");
      }
    } catch (error) {
      console.error("Error deleting file(s):", error);
      showAlert("error", "Failed to delete file(s).");
    }
  };

  const handleShare = async () => {
    if (!selectedFiles.length) {
      showAlert("error", "Please select files to share.");
      return;
    }
    // Prepare the common data
    const filesToShare = multiSelectMode ? selectedFiles : [selectedFiles[0]];
    const receiverIds = selectedReceivers.map((receiver) =>
      parseInt(receiver.split(".")[0])
    );
    const rule_Id = selectedRules.map((rule) => parseInt(rule.split(".")[0]));
    try {
      let response;

      if (sharingMode === "rules" && selectedRules.length > 0) {
        response = await axios.post("/api/rule/shareFilesUsingRules", {
          receiverids: receiverIds,
          files: filesToShare,
          ruleIds: rule_Id,
        });
      } else {
        // Use the original sharing logic
        const from_time = selectedFromTime ? selectedFromTime.toString() : null;
        const to_time = selectedToTime ? selectedToTime.toString() : null;
        const schedule_time = selectedDateTime
          ? selectedDateTime.toString()
          : null;

        response = await axios.post("/api/rule/shareFiles", {
          receiverids: receiverIds,
          files: filesToShare,
          from_time,
          to_time,
          schedule_time,
        });
      }

      if (response.data.success) {
        showAlert("success", "File(s) shared successfully!");
        setShowShareForm(false);
        setSelectedReceivers([]);
        setSelectedFiles([]);
        setSelectedRules([]);
        setSelectedDateTime("");
        setSelectedFromTime("");
        setSelectedToTime("");
        setSharingMode("none");
      } else {
        showAlert("error", "Failed to share file(s).");
      }
    } catch (error) {
      console.error("Error sharing file(s):", error.message || error);
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        showAlert("error", error.response.data.message);
      } else {
        showAlert("error", "An unexpected error occurred. Please try again.");
      }
    }
  };

  const userRules = async () => {
    try {
      const response = await axios.get("/api/rule/allUserRules");
      if (response.data.success) {
        setRules(
          response.data.data.map((rule) => `${rule.id}. ${rule.rule_name}`)
        );
      } else {
        console.error("API returned success: false");
      }
    } catch (err) {
      console.error("Error fetching rules:", err);
    }
  };

  const handleRulesSelect = (selectedList) => {
    if (selectedList.length > 0) {
      setSharingMode("rules");
      setSelectedDateTime("");
      setSelectedFromTime("");
      setSelectedToTime("");
      setShowAvailability(false);
    } else if (selectedList.length === 0) {
      setSharingMode("none");
    }
    setSelectedRules(selectedList);
  };

  const handleDateTimeChange = (e) => {
    if (e.target.value) {
      setSharingMode("schedule");
      setSelectedRules([]);
    } else if (!e.target.value && !selectedFromTime && !selectedToTime) {
      setSharingMode("none");
    }
    setSelectedDateTime(e.target.value);
  };

  const handleAvailabilityChange = (type, value) => {
    if (value) {
      setSharingMode("schedule");
      setSelectedRules([]);
    } else if (
      !value &&
      !selectedDateTime &&
      (type === "from" ? !selectedToTime : !selectedFromTime)
    ) {
      setSharingMode("none");
    }

    if (type === "from") {
      setSelectedFromTime(value);
    } else {
      setSelectedToTime(value);
    }
  };

  useEffect(() => {
    userRules();
  }, []);

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
      {alert.show && (
        <AlertComponent
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ show: false, type: "", message: "" })}
        />
      )}
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
            multiple
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
              className={`relative border rounded-lg shadow-md bg-gray-700 p-8 text-center hover:shadow-lg transition duration-300`}
              style={{ width: "200px", height: "100px" }}
            >
              {multiSelectMode && (
                <input
                  type="checkbox"
                  checked={selectedFiles.includes(file)}
                  onChange={() => toggleFileSelection(file)}
                  className="absolute top-2 left-2 w-5 h-5"
                />
              )}
              <div
                className="text-lg font-semibold text-white truncate overflow-hidden"
                style={{ whiteSpace: "nowrap" }}
                title={`${file.file_name}${
                  file.format ? "." + file.format : ""
                }`}
              >
                {file.file_name}
                {file.format ? "." + file.format : ""}
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
                      toggleFileSelection(file);
                    }}
                    className="block px-4 py-2 hover:bg-gray-100 w-full text-left text-green-500"
                  >
                    Share
                  </button>

                  <button
                    onClick={() => handleView(file.file_url)}
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
              <div
                ref={receiverDropdownRef}
                className="relative"
                onClick={() => setReceiverDropdownOpen(!receiverDropdownRef)}
              >
                <Multiselect
                  options={receivers}
                  isObject={false}
                  selectedValues={selectedReceivers}
                  placeholder={
                    selectedReceivers.length === 0 ? "Select Recipients" : ""
                  }
                  onSelect={handleRecipientsSelect}
                  onRemove={handleRecipientsSelect}
                  avoidHighlightFirstOption
                  showCheckbox
                  style={{
                    chips: { background: "#3B82F6" },
                    multiselectContainer: { color: "#000" },
                    searchBox: { background: "#fff" },
                  }}
                />
              </div>
              {/* Date and Time Picker */}
              <div
                className={`flex flex-col ${
                  sharingMode === "rules"
                    ? "opacity-50 pointer-events-none"
                    : ""
                }`}
              >
                <label className="text-gray-700 underline mb-2">
                  Schedule Time for Share
                </label>
                <input
                  type="datetime-local"
                  value={selectedDateTime}
                  onChange={handleDateTimeChange}
                  className="border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Availability Section */}
              <div
                className={`flex flex-col ${
                  sharingMode === "rules"
                    ? "opacity-50 pointer-events-none"
                    : ""
                }`}
              >
                <label
                  onClick={() => {
                    if (sharingMode !== "rules") {
                      setShowAvailability(!showAvailability);
                    }
                  }}
                  className={`cursor-pointer text-gray-700 underline mb-2 ${
                    sharingMode === "rules" ? "cursor-not-allowed" : ""
                  }`}
                >
                  Mention Availability of the File
                </label>

                {showAvailability && (
                  <div className="flex flex-col space-y-2">
                    <div className="flex flex-col">
                      <label className="text-gray-700">From Time</label>
                      <input
                        type="datetime-local"
                        value={selectedFromTime}
                        onChange={(e) =>
                          handleAvailabilityChange("from", e.target.value)
                        }
                        className="border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-gray-700">To Time</label>
                      <input
                        type="datetime-local"
                        value={selectedToTime}
                        onChange={(e) =>
                          handleAvailabilityChange("to", e.target.value)
                        }
                        className="border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              ref={ruleDropdownRef}
              className={`relative ${
                sharingMode === "schedule"
                  ? "opacity-50 pointer-events-none"
                  : ""
              }`}
              onClick={() => setRulesDropdownOpen(!ruleDropdownRef)}
            >
              <Multiselect
                options={rules}
                isObject={false}
                selectedValues={selectedRules}
                placeholder={selectedRules.length === 0 ? "Select Rules" : ""}
                onSelect={handleRulesSelect}
                onRemove={handleRulesSelect}
                avoidHighlightFirstOption
                showCheckbox
                style={{
                  chips: { background: "#3B82F6" },
                  multiselectContainer: { color: "#000" },
                  searchBox: { background: "#fff" },
                }}
              />
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
