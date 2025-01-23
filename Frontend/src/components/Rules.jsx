import React, { useState, useEffect, useRef } from "react";
import Multiselect from "multiselect-react-dropdown";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

function Rules() {
  const {user} = useAuth();
  const [rules, setRules] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentRuleId, setCurrentRuleId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    fileType: [],
    fileSize: "",
    fromTime: "",
    toTime: "",
    recipients: [],
  });

  // console.log(formData);

  const fileTypes = ["pdf", "docx", "xls", "txt"];
  const receiversList = ["All Users", "Team A", "Team B", "Team C"];

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

useEffect(() => {
    const fetchRules = async () => {
      try {
        const response = await axios.get("/api/rule/allUserRules");
        console.log(response.data.data);
        setRules(response.data.data);
        // console.log(response.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchRules();
  }, [user]);

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
    setFormData({
      ...formData,
      recipients: selectedList.map((item) => item),
    });
  };

  const handleAddNewRule = () => {
    setFormData({
      name: "",
      fileType: [],
      fileSize: "",
      scheduleTime: "",
      fromTime: "",
      toTime: "",
      recipients: [],
    });
    setIsEdit(false);
    setShowForm(true);
  };

  const handleSaveRule = async () => {
    if (
      !formData.name &&
      !formData.fileType.length &&
      !formData.fileSize &&
      !formData.scheduleTime &&
      !formData.fromTime &&
      !formData.toTime &&
      !formData.recipients.length
    ) {
      alert("All fields are required!");
      return;
    }
    const timeRange = `${formData.fromTime} - ${formData.toTime}`;

    try {
      const response = await axios.post("/api/rule/AddNewRule", {
        rule_name: formData.name,
        file_type: formData.fileType.join(", ") || null,
        allowed_file_size: formData.fileSize || null,
        schedule_time: formData.scheduleTime || null,
        from_time: formData.fromTime || null, 
        to_time: formData.toTime || null,
        recipients: formData.recipients.join(", ") || null,
      });
      if(response.data.message) {
        alert("Rule added successfully!");
      }
      console.log(response);
    } catch (error) {
      console.log(error);
      alert("Something went wrong!");
    }

    if (isEdit) {
      setRules(
        rules.map((rule) =>
          rule.id === currentRuleId
            ? {
                ...rule,
                name: formData.name,
                fileType: formData.fileType.join(", "),
                fileSize: `${formData.fileSize}MB`,
                fromTime: formData.fromTime,
                toTime: formData.toTime,
                receivers: formData.recipients.join(", "),
              }
            : rule
        )
      );
    } else {
      const newRule = {
        id: rules.length + 1,
        name: formData.name,
        fileType: formData.fileType.join(", "),
        fileSize: `${formData.fileSize } `,
        from_time: `${formData.fromTime}` ,
        to_time: `${formData.toTime}`,
        receivers: formData.recipients.join(", "),
      };
      setRules([...rules, newRule]);
    }

    setShowForm(false);
    setIsEdit(false);
  };

  const handleEditRule = (rule) => {
    setFormData({
      name: rule.name,
      fileType: rule.fileType.split(", "),
      fileSize: rule.fileSize.replace("MB", ""),
      fromTime: rule.from_time,
      toTime : rule.to_time,
      recipients: rule.receivers.split(", "),
    });
    setCurrentRuleId(rule.id);
    setIsEdit(true);
    setShowForm(true);
  };

  const handleDeleteRule = (id) => {
    const updatedRules = rules.filter((rule) => rule.id !== id);
    setRules(updatedRules);
  };

  return (
    // hello
    <div className="px-6 py-4 rounded-3xl bg-cardColor overflow-hidden min-h-screen">
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
                <th className="p-2">Available Time</th>
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
                  <td className="px-6 py-4">{rule.rule_name}</td>   
                  <td className="px-6 py-4">{rule.fileType || "All"}</td>
                  <td className="px-6 py-4">{rule.fileSize|| "Not defined"}</td>
                  <td className="px-6 py-4">{rule.from_time || "Not defined"} - {rule.to_time || "Not Defined"}</td>
                  <td className="px-6 py-4">{rule.receivers || "All"}</td>
                  <td className="px-6 py-4 flex gap-2 justify-center">
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
            <div className="bg-gray-800 p-6 rounded shadow-lg w-11/12 sm:w-3/4 md:w-1/2 lg:max-w-md">
              <h3 className="text-xl font-semibold mb-4 text-white">
                {isEdit ? "Edit Rule" : "Add New Rule"}
              </h3>

              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">
                    Rule Name
                  </label>
                  <input
                    type="text"
                    placeholder="Rule Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="p-2 w-full bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">
                    File Type
                  </label>
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
                      placeholder="Select File Type"
                      onSelect={handleFileTypeSelect}
                      onRemove={handleFileTypeSelect}
                      avoidHighlightFirstOption
                      showCheckbox
                      dropdownOpened={fileTypeDropdownOpen}
                      style={{
                        chips: { background: "#3B82F6" },
                        multiselectContainer: { color: "#000" },
                        searchBox: { background: "#374151" },
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">
                    Allowed File Size (in MB)
                  </label>
                  <input
                    type="number"
                    placeholder="Allowed File Size (e.g., 2)"
                    name="fileSize"
                    value={formData.fileSize}
                    onChange={handleInputChange}
                    className="p-2 w-full bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-300">
                    Recipients
                  </label>
                  <div
                    ref={receiversDropdownRef}
                    className="relative"
                    onClick={() =>
                      setReceiversDropdownOpen(!receiversDropdownOpen)
                    }
                  >
                    <Multiselect
                      options={receiversList}
                      isObject={false}
                      selectedValues={formData.recipients}
                      placeholder="Select Recipients"
                      onSelect={handleRecipientsSelect}
                      onRemove={handleRecipientsSelect}
                      avoidHighlightFirstOption
                      showCheckbox
                      dropdownOpened={receiversDropdownOpen}
                      style={{
                        chips: { background: "#3B82F6" },
                        multiselectContainer: { color: "#000" },
                        searchBox: { background: "#374151" },
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 mt-4 text-gray-300">
                  Schedule Time
                </label>
                <div>
                  <input
                    type="datetime-local"
                    name="scheduleTime"
                    value={formData.scheduleTime}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduleTime: e.target.value })
                    }
                    className="p-2 w-full bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 mt-4 text-gray-300">
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
                    className="p-2 w-1/2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="datetime-local"
                    name="toTime"
                    value={formData.toTime}
                    onChange={(e) =>
                      setFormData({ ...formData, toTime: e.target.value })
                    }
                    className="p-2 w-1/2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6 gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="bg-gray-600 px-4 py-2 rounded hover:bg-gray-700 text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRule}
                  className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600 text-white"
                >
                  Save
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
