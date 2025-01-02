import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/Authcontext.jsx";
import Select from "react-select"; // Assuming you're using react-select for multi-select fields

function AvailableFile() {
  const { userRole, user } = useAuth();
  const [userId, setUserId] = useState(null);
  const [files, setFiles] = useState([]);

  const [receivers, setReceivers] = useState([
    { value: 'user1', label: 'User 1' },
    { value: 'user2', label: 'User 2' },
    { value: 'user3', label: 'User 3' },
  ]);
  

  const [showOptions, setShowOptions] = useState(null);
  const [showShareForm, setShowShareForm] = useState(false);


  const [selectedFile, setSelectedFile] = useState(null);
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
        const filesResponse = await axios.post(`/api/file/allUserFiles/${userId}`);
        if (filesResponse.data.data) {
          setFiles(filesResponse.data.data); // Update state with fetched files
          console.log('Fetched files:', filesResponse.data.data);
        } else {
          console.error('No files found in response.');
        }
      } catch (error) {
        console.error("Error fetching files:", error);
      }
    };

    fetchData();
  }, [userId]);

  const openOptions = (index) => setShowOptions(index);
  const closeOptions = () => setShowOptions(null);

  const openShareForm = (file) => {
    console.log(file)
    setSelectedFile(file); // Store selected file data
    setShowShareForm(true);
    setShowOptions(null);
  };

  const closeShareForm = () => {
    setShowShareForm(false);
    setSelectedFile(null);
  };



  const handleShare = async () => {
    try {
      const shareData = {
        receivers: selectedReceivers.map((r) => r.value),
        dateTime: selectedDateTime,
        rules: selectedRules.map((r) => r.value),
        file_name: selectedFile.name,
        file_url: selectedFile.url,
        file_size: selectedFile.size,
        resource_type: selectedFile.type,
        format: selectedFile.format,
      };

      await axios.post("/api/file/shareFile", shareData);
      alert("File shared successfully!");
      closeShareForm();
    } catch (error) {
      console.error("Error sharing file:", error);
      alert("Failed to share file.");
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
    <div className="px-6 py-4 rounded-lg bg-cardColor">
      <h2 className="text-center text-2xl font-bold mb-6 text-white">
        Available Files
      </h2>

      {/* File Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {files.map((file, index) => (
          <div
            key={index}
            className="relative border rounded-lg shadow-md bg-gray-700 p-6 text-center hover:shadow-lg transition duration-300"
          >
            <div className="text-lg font-semibold text-white">{file.file_name}</div>
            <button
              onClick={() => openOptions(index)}
              className="absolute top-2 right-2 text-white hover:text-gray-200"
            >
              &#x22EE;
            </button>
            {showOptions === index && (
              <div
                ref={optionsRef}
                className="absolute top-10 right-2 bg-white border rounded-lg shadow-md z-50 "
              >
                <button
                  onClick={() => openShareForm(file)}
                  className="block px-4 py-2 hover:bg-gray-100 w-full text-left text-green-500"
                >
                  Share
                </button>
                <button
                  onClick={closeOptions}
                  className="block px-4 py-2 hover:bg-gray-100 w-full text-left text-blue-500"
                >
                  View
                </button>
                <button
                  onClick={closeOptions}
                  className="block px-4 py-2 hover:bg-gray-100 w-full text-left text-red-500"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Share Form Modal */}
      {showShareForm && selectedFile && (
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
                onClick={handleShare}
                className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600"
              >
                Share
              </button>
              <button
                onClick={closeShareForm}
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
