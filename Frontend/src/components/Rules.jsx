import React, { useState, useEffect, useRef } from "react";
import Multiselect from "multiselect-react-dropdown";

function Rules() {
  const [rules, setRules] = useState([
    {
      id: 1,
      name: "Rule 1",
      fileType: "pdf",
      fileSize: "2MB",
      time: "08:00 AM - 10:00 AM",
      receivers: "All Users",
    },
    {
      id: 2,
      name: "Rule 2",
      fileType: "docx",
      fileSize: "5MB",
      time: "03:00 PM - 05:00 PM",
      receivers: "Team A",
    },
    {
      id: 2,
      name: "Rule 2",
      fileType: "docx",
      fileSize: "5MB",
      time: "03:00 PM - 05:00 PM",
      receivers: "Team A",
    }, {
      id: 2,
      name: "Rule 2",
      fileType: "docx",
      fileSize: "5MB",
      time: "03:00 PM - 05:00 PM",
      receivers: "Team A",
    },
    {
      id: 2,
      name: "Rule 2",
      fileType: "docx",
      fileSize: "5MB",
      time: "03:00 PM - 05:00 PM",
      receivers: "Team A",
    },
    {
      id: 2,
      name: "Rule 2",
      fileType: "docx",
      fileSize: "5MB",
      time: "03:00 PM - 05:00 PM",
      receivers: "Team A",
    },
    {
      id: 2,
      name: "Rule 2",
      fileType: "docx",
      fileSize: "5MB",
      time: "03:00 PM - 05:00 PM",
      receivers: "Team A",
    },
    {
      id: 2,
      name: "Rule 2",
      fileType: "docx",
      fileSize: "5MB",
      time: "03:00 PM - 05:00 PM",
      receivers: "Team A",
    },
    {
      id: 2,
      name: "Rule 2",
      fileType: "docx",
      fileSize: "5MB",
      time: "03:00 PM - 05:00 PM",
      receivers: "Team A",
    },
    {
      id: 2,
      name: "Rule 2",
      fileType: "docx",
      fileSize: "5MB",
      time: "03:00 PM - 05:00 PM",
      receivers: "Team A",
    },
    {
      id: 2,
      name: "Rule 2",
      fileType: "docx",
      fileSize: "5MB",
      time: "03:00 PM - 05:00 PM",
      receivers: "Team A",
    },
    {
      id: 2,
      name: "Rule 2",
      fileType: "docx",
      fileSize: "5MB",
      time: "03:00 PM - 05:00 PM",
      receivers: "Team A",
    },
  ]);

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
      (fileTypeDropdownRef.current && !fileTypeDropdownRef.current.contains(e.target)) &&
      (receiversDropdownRef.current && !receiversDropdownRef.current.contains(e.target))
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
      fromTime: "",
      toTime: "",
      recipients: [],
    });
    setIsEdit(false);
    setShowForm(true);
  };

  const handleSaveRule = () => {
    if (
      !formData.name ||
      !formData.fileType.length ||
      !formData.fileSize ||
      !formData.fromTime ||
      !formData.toTime ||
      !formData.recipients.length
    ) {
      alert("All fields are required!");
      return;
    }

    const timeRange = `${formData.fromTime} - ${formData.toTime}`;

    if (isEdit) {
      setRules(
        rules.map((rule) =>
          rule.id === currentRuleId
            ? {
                ...rule,
                name: formData.name,
                fileType: formData.fileType.join(", "),
                fileSize: `${formData.fileSize}MB`,
                time: timeRange,
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
        fileSize: `${formData.fileSize}MB`,
        time: timeRange,
        receivers: formData.recipients.join(", "),
      };
      setRules([...rules, newRule]);
    }

    setShowForm(false);
    setIsEdit(false);
  };

  const handleEditRule = (rule) => {
    const [startTime, endTime] = rule.time.split(" - ");
    setFormData({
      name: rule.name,
      fileType: rule.fileType.split(", "),
      fileSize: rule.fileSize.replace("MB", ""),
      fromTime,
      toTime,
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
                <th className="p-2">File Size</th>
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
                  <td className="px-6 py-4">{rule.name}</td>
                  <td className="px-6 py-4">{rule.fileType}</td>
                  <td className="px-6 py-4">{rule.fileSize}</td>
                  <td className="px-6 py-4">{rule.time}</td>
                  <td className="px-6 py-4">{rule.receivers}</td>
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
                    onClick={() => setFileTypeDropdownOpen(!fileTypeDropdownOpen)}
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
                    onClick={() => setReceiversDropdownOpen(!receiversDropdownOpen)}
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
