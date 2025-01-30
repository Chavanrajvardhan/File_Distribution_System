import React, { useState, useEffect, useRef } from "react";
import Multiselect from "multiselect-react-dropdown";
import axios from "axios";
import Alert from "@mui/joy/Alert";
import IconButton from "@mui/joy/IconButton";
import Typography from "@mui/joy/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import ReportIcon from "@mui/icons-material/Report";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

function Rules() {
  const [rules, setRules] = useState([]);
  const [receivers, setReceivers] = useState([]);
  const [selectedReceivers, setSelectedReceivers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editRule, setEditRule] = useState(null);
  const [currentRuleId, setCurrentRuleId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    fileType: [],
    fileSize: "",
    fromTime: "",
    toTime: "",
    recipients: [],
  });

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

  const fileTypes = ["pdf", "docx", "xls", "txt", "png", "jpg", "jpeg", "gif"];
  const fileTypeDropdownRef = useRef(null);
  const receiversDropdownRef = useRef(null);

  const [fileTypeDropdownOpen, setFileTypeDropdownOpen] = useState(false);
  const [receiversDropdownOpen, setReceiversDropdownOpen] = useState(false);

  const handleClickOutside = (e) => {
    if (
      fileTypeDropdownRef.current &&
      !fileTypeDropdownRef.current.contains(e.target) &&
      receiversDropdownRef.current &&
      !receiversDropdownRef.current.contains(e.target)
    ) {
      setFileTypeDropdownOpen(false);
      setReceiversDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileTypeSelect = (selectedList) => {
    setFormData({
      ...formData,
      fileType: selectedList.map((item) => item),
    });
  };

  const handleRecipientsSelect = (selectedList) => {
    setSelectedReceivers(selectedList);
  };

  const handleAddNewRule = () => {
    setFormData({
      name: "",
      fileType: [],
      fileSize: "",
      fromTime: "",
      toTime: "",
      recipients: [],
    });
    setIsEdit(false);
    setShowForm(true);
  };

  const fetchRules = async () => {
    try {

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

      const response = await axios.get("/api/rule/allUserRules");
      if (response.data.success == true) {
        setRules(response.data.data);
      }
 
    } catch (err) {
      // console.error("Failed to fetch rules:", err.message);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleSaveRule = async () => {
    const payload = {
      rule_name: formData.name,
      from_time: formData.fromTime ? formData.fromTime.toString() : null,
      to_time: formData.toTime ? formData.toTime.toString() : null,
      format:
        formData.fileType && formData.fileType.length > 0
          ? formData.fileType
          : null,
      allowed_file_size: formData.fileSize || null,
      recipients:
        selectedReceivers.length > 0
          ? selectedReceivers.map((receiver) =>
              parseInt(receiver.split(".")[0])
            )
          : null,
    };
    try {
      let response;
      if (isEdit) {
        response = await axios.put(
          `/api/rule/updateRule/${editRule.id}`,
          payload
        );
      } else {
        response = await axios.post("/api/rule/AddNewRule", payload);
      }

      if (response.data.status === true) {
        setShowForm(false);
        fetchRules();
        setFormData({
          name: "",
          fileType: [],
          fileSize: "",
          fromTime: "",
          toTime: "",
          recipients: [],
        });
        setSelectedReceivers([]);
        setIsEdit(false);
        setCurrentRuleId(null);
        showAlert("success", response.data.message);
      }
    } catch (error) {
      showAlert("error", error.response?.data?.message || "Failed to save rule");
    }
  };

  const handleEditRule = (rule) => {
    setEditRule(rule);
    // Function to parse and convert the date from backend format
    const convertBackendDateToForm = (dateStr) => {
      if (!dateStr) return "";

      try {
        const [datePart, timePart] = dateStr.split(", ");
        const [day, month, year] = datePart.split("/");
        const [timePortion, period] = timePart.split(" ");
        let [hours, minutes] = timePortion.split(":");

        // Convert to 24-hour format
        hours = parseInt(hours);
        if (period.toLowerCase() === "pm" && hours !== 12) {
          hours += 12;
        } else if (period.toLowerCase() === "am" && hours === 12) {
          hours = 0;
        }

        // Format date parts with padding
        const formattedMonth = month.padStart(2, "0");
        const formattedDay = day.padStart(2, "0");
        const formattedHours = hours.toString().padStart(2, "0");
        const formattedMinutes = minutes.padStart(2, "0");

        // Return in the format expected by datetime-local input (YYYY-MM-DDThh:mm)
        return `${year}-${formattedMonth}-${formattedDay}T${formattedHours}:${formattedMinutes}`;
      } catch (error) {
        console.error("Date conversion error:", error);
        return "";
      }
    };

    // Handle recipients
    const selectedRecipientsList = rule.recipients
      ? (typeof rule.recipients === "string"
          ? rule.recipients.split(",")
          : rule.recipients
        )
          .map((id) => {
            const trimmedId = id.toString().trim();
            return receivers.find((r) => r.startsWith(trimmedId)) || "";
          })
          .filter(Boolean)
      : [];

    // Convert dates
    const fromTimeFormatted = convertBackendDateToForm(rule.from_time);
    const toTimeFormatted = convertBackendDateToForm(rule.to_time);

    const sizeInMB = rule.allowed_file_size / 1024 /1024;
    // Set form data
    setFormData({
      name: rule.rule_name || "",
      fileType: Array.isArray(rule.format) ? rule.format : "",
      fileSize: sizeInMB ?.toString() || null,
      fromTime: fromTimeFormatted,
      toTime: toTimeFormatted,
      recipients: selectedRecipientsList,
    });

    // Update other state
    setSelectedReceivers(selectedRecipientsList);
    setCurrentRuleId(rule.id);
    setIsEdit(true);
    setShowForm(true);
  };

  const handleDeleteRule = async (id) => {
    // if (!window.confirm("Are you sure you want to delete this rule?")) return;
  
    try {
      const response = await axios.delete(`/api/rule/deleteRule/${id}`);
  
      if (response.data.status) {
        showAlert("success", response.data.message);
        fetchRules();
      } else {
        console.error("Failed to delete rule:", response.data.message || "Unknown error");
      }
    } catch (error) {
      console.error("Error deleting rule:", error.message);
      showAlert("error", error.response?.data?.message || "Failed to delete rule");
    }
  };

  const bytesToMB = (bytes) => {
    if (bytes === null || bytes === undefined) {
      return null;
    }
    const MB = 1024 * 1024;
    return (bytes / MB).toFixed(6);
  };

  return (
    <div className="px-6 py-4 rounded-3xl bg-cardColor overflow-hidden min-h-screen">
       {alert.show && (
        <AlertComponent
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ show: false, type: "", message: "" })}
        />
      )}
      <div className="flex flex-col text-white">
        <div className="p-2 flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Existing Rules</h2>
          <button
            onClick={handleAddNewRule}
            className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600"
          >
            + Add New Rule
          </button>
        </div>

        <div className="max-h-[85vh] text-center overflow-y-auto rounded-lg">
          <table className="w-full border-collapse">
            <thead>
              <tr className="sticky top-0 bg-gray-700">
                <th className="p-2">Rule Name</th>
                <th className="p-2">File Type</th>
                <th className="p-2">File Size (MB)</th>
                <th className="p-2">File Available From Time</th>
                <th className="p-2">File Availale To Time</th>
                {/* <th className="p-2">Schedule Time</th> */}
                {/* <th className="p-2">Available Time</th> */}
                <th className="p-2">Receivers</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              
              {rules.map((rule) => (
                <tr
                  key={rule.id}
                  className="border-b last:border-0 hover:bg-gray-800"
                >
                  <td
                    className="px-6 py-4 truncate max-w-[140px] overflow-hidden whitespace-nowrap text-ellipsis cursor-pointer"
                    title={rule.rule_name}
                  >
                    {rule.rule_name}
                  </td>
                  <td
                    className="px-6 py-4 truncate max-w-[140px] overflow-hidden whitespace-nowrap text-ellipsis cursor-pointer"
                    title={
                      rule.format && rule.format.length > 0
                        ? rule.format.join(", ") // Converts array to a comma-separated string
                        : "All type"
                    }
                  >
                    {rule.format && rule.format.length > 0
                      ? rule.format.join(", ") // Converts array to a comma-separated string
                      : "All type"}
                  </td>
                  <td
                    className="px-6 py-4 truncate max-w-[140px] overflow-hidden whitespace-nowrap text-ellipsis cursor-pointer"
                    title={bytesToMB(rule.allowed_file_size) || "Not defined"}
                  >
                    {bytesToMB(rule.allowed_file_size) || "Not defined"}
                  </td>
                  <td
                    className="px-6 py-4 truncate max-w-[140px] overflow-hidden whitespace-nowrap text-ellipsis cursor-pointer"
                    title={rule.from_time || "Not defined"}
                  >
                    {/* Debug log */}
                    {rule.from_time || "Not defined"}
                  </td>
                  <td
                    className="px-6 py-4 truncate max-w-[140px] overflow-hidden whitespace-nowrap text-ellipsis cursor-pointer"
                    title={rule.to_time || "Not defined"}
                  >
                    {rule.to_time || "Not defined"}
                  </td>
          
                  <td className="px-6 py-4"
                  title={rule.recipients && rule.recipients.length > 0 ? rule.recipients.join(", ") : "Not defined"}>
                    {rule.recipients && rule.recipients.length > 0 ? rule.recipients.join(", ") : "Not defined"}
                  </td>
                  <td className="py-4 flex gap-2 justify-center">
                    <button
                      onClick={() => handleEditRule(rule)}
                      className="bg-yellow-500 px-3 py-1 rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded shadow-lg w-11/12 sm:w-3/4 md:w-1/2 lg:max-w-md">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">
                {isEdit ? "Edit Rule" : "Add New Rule"}
              </h3>

              <div className="grid gap-4">
                <div>
                  {/* <label className="block text-sm font-medium mb-1 text-gray-800">
                    Rule Name
                  </label> */}
                  <input
                    type="text"
                    placeholder="Rule Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="p-2 w-full border text-gray-800 bg-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  {/* <label className="block text-sm font-medium mb-1 text-gray-800">
                    File Type
                  </label> */}
                  <div
                    ref={fileTypeDropdownRef}
                    className="relative"
                    onClick={() =>
                      setFileTypeDropdownOpen(!fileTypeDropdownOpen)
                    }
                  >
                    <Multiselect
                      options={fileTypes}
                      isObject={false}
                      selectedValues={formData.fileType}
                      placeholder={
                        formData.fileType.length === 0 ? "Select File Type" : ""
                      }
                      onSelect={handleFileTypeSelect}
                      onRemove={handleFileTypeSelect}
                      avoidHighlightFirstOption
                      showCheckbox
                      dropdownOpened={fileTypeDropdownOpen}
                      style={{
                        chips: { background: "#3B82F6" },
                        multiselectContainer: { color: "#000" },
                        searchBox: { background: "#fff" },
                      }}
                    />
                  </div>
                </div>

                <div>
                  {/* <label className="block text-sm font-medium mb-1 text-gray-800">
                    Allowed File Size (in MB)
                  </label> */}
                  <input
                    type="number"
                    placeholder="Allowed File Size (e.g., 2)"
                    name="fileSize"
                    value={formData.fileSize}
                    onChange={handleInputChange}
                    className="p-2 border w-full text-gray-800 bg-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  {/* <label className="block text-sm font-medium mb-1 text-gray-800">
                    Recipients
                  </label> */}
                  <div
                    ref={receiversDropdownRef}
                    className="relative"
                    onClick={() =>
                      setReceiversDropdownOpen(!receiversDropdownOpen)
                    }
                  >
                    <Multiselect
                      options={receivers}
                      isObject={false}
                      selectedValues={selectedReceivers}
                      placeholder={
                        formData.recipients.length === 0
                          ? "Select Recipients"
                          : ""
                      }
                      onSelect={handleRecipientsSelect}
                      onRemove={handleRecipientsSelect}
                      avoidHighlightFirstOption
                      showCheckbox
                      dropdownOpened={receiversDropdownOpen}
                      style={{
                        chips: { background: "#3B82F6" },
                        multiselectContainer: { color: "#000" },
                        searchBox: { background: "#fff" },
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm underline font-medium mb-1 mt-4 text-gray-800">
                  Time Available (From - To)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="datetime-local"
                    name="fromTime"
                    value={formData.fromTime}
                    onChange={(e) =>
                      setFormData({ ...formData, fromTime: e.target.value })
                    }
                    className="p-2 border text-gray-800 w-1/2 bg-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="datetime-local"
                    name="toTime"
                    value={formData.toTime}
                    onChange={(e) =>
                      setFormData({ ...formData, toTime: e.target.value })
                    }
                    className="p-2 w-1/2 border text-gray-800 bg-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={handleSaveRule}
                  className="bg-green-500 px-4 py-2 rounded hover:bg-green-600 text-white"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="bg-red-500 px-4 py-2 rounded hover:bg-red-600 text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Rules;
