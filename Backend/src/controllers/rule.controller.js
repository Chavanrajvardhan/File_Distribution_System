import connectDB from "../db/db.js";
import asyncHandler from "../utils/asyncHandler.js";
import { convertToIndianTime } from "../utils/dateTimeConverter.js";

const validateTimeInputs = ({ from_time, to_time, schedule_time }) => {
  const currentDate = new Date(); // Current time in UTC

  // Validate schedule_time
  if (schedule_time) {
    const scheduleTime = new Date(schedule_time);
    if (scheduleTime < currentDate) {
      return {
        isValid: false,
        message: "Schedule time can't be in the past.",
      };
    }
  }

  // Validate from_time
  if (from_time) {
    const fromTime = new Date(from_time);
    if (fromTime < currentDate) {
      return {
        isValid: false,
        message: "File sharing start time can't be in the past.",
      };
    }
  }

  // Validate to_time
  if (to_time) {
    const toTime = new Date(to_time);
    if (toTime < currentDate) {
      return {
        isValid: false,
        message: "File sharing end time can't be in the past.",
      };
    }
  }

  // Validate from_time and to_time
  if (from_time && to_time) {
    const fromTime = new Date(from_time);
    const toTime = new Date(to_time);

    if (fromTime > toTime) {
      return {
        isValid: false,
        message: "End time must be after the start time.",
      };
    }
  }

  // Validate schedule_time and from_time
  if (schedule_time && from_time) {
    const scheduleTime = new Date(schedule_time);
    const fromTime = new Date(from_time);

    if (fromTime < scheduleTime) {
      return {
        isValid: false,
        message: "File sharing start time can't be before the scheduled time.",
      };
    }
  }

  // Validate schedule_time and to_time
  if (schedule_time && to_time) {
    const scheduleTime = new Date(schedule_time);
    const toTime = new Date(to_time);

    if (toTime < scheduleTime) {
      return {
        isValid: false,
        message: "File sharing end time can't be before the scheduled time.",
      };
    }
  }

  return { isValid: true }; // All validations passed
};

const shareFiles = asyncHandler(async (req, res) => {
  const db = await connectDB();
  const sender_id = req.user.user_id;
  const sender_name = `${req.user.first_name} ${req.user.last_name}`;
  const { receiverids, files, from_time, to_time, schedule_time } = req.body;
 
  const utcFromTime = from_time ? new Date(from_time).toISOString() : null;
  const utcToTime = to_time ? new Date(to_time).toISOString() : null;
  const utcScheduleTime = schedule_time ? new Date(schedule_time).toISOString() : null;
 
 
  if (!receiverids || !Array.isArray(receiverids) || receiverids.length === 0) {
    return res.status(400).json({ status: false, message: "Select at least one Receiver" });
  }
 
 
  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ status: false, message: "File must be selected" });
  }
 
 
  for (const file of files) {
    file.format = file.format ?? null;
    if (!(file.file_url && file.file_name && file.file_size )) {
      return res.status(400).json({ status: false, message: "All file fields must be provided" });
    }
  }
 
  const validTimes = {
    from_time: utcFromTime,
    to_time: utcToTime,
    schedule_time: utcScheduleTime,
  };
 
  const validationResult = validateTimeInputs(validTimes);
 
 
  if (!validationResult.isValid) {
    return res.status(400).json({ status: false, message: validationResult.message });
  }
  const folder = "IN";
  const created_at = new Date().toISOString();
  const updated_at = created_at;
 
  const insertPromises = receiverids.flatMap((receiverid) =>
    files.map((file) =>{
      const status = utcScheduleTime ? 'pending' : 'completed';
      db.query(
        `INSERT INTO sharefiles
         (sender_id, sender_name, user_id, file_url, file_name, file_size,  format, folder, from_time, to_time, schedule_time, created_at, updated_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sender_id,
          sender_name,
          receiverid,
          file.file_url,
          file.file_name,
          file.file_size,
          file.format,
          folder,
          utcFromTime,
          utcToTime,
          utcScheduleTime,
          created_at,
          updated_at,
          status
        ]
      )
})
  );
 
  try {
    await Promise.all(insertPromises);
    return res.status(200).json({
      success: true,
      message: `Files successfully shared with ${receiverids.length} receiver(s)`,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

const newUserRule = asyncHandler(async (req, res) => {
  const db = await connectDB();
  const userId = req.user.user_id;
 
  if (!userId) {
    return res.status(400).json({ message: "Invalid userId" });
  }
 
  const {
    rule_name,
    from_time,
    to_time,
    schedule_time,
    format,
    allowed_file_size,
    recipients,
  } = req.body;
 
  let sizeInbytes;
if(allowed_file_size > 0){
   sizeInbytes = allowed_file_size * 1024 * 1024;}
  else{
     sizeInbytes = null;
  } 
  if (!rule_name) {
    return res.status(400).json({ message: "Rule name is required." });
  }
 
  // Check if at least one type of rule data is provided
  if (
    !(
      from_time || 
      to_time ||
      schedule_time ||
      format ||
      allowed_file_size ||
      recipients
    )
  ) {
    return res
      .status(400)
      .json({ message: "At least one type of rule is required." });
  }
 
  // Convert local time to UTC
  const from_time_utc = from_time ? new Date(from_time).toISOString() : null;
  const to_time_utc = to_time ? new Date(to_time).toISOString() : null;
  const schedule_time_utc = schedule_time
    ? new Date(schedule_time).toISOString()
    : null;
  const created_at = new Date().toISOString();
 
 
  // Validate time-related inputs using validateTimeInputs()
  const validationResult = validateTimeInputs({
    from_time: from_time_utc,
    to_time: to_time_utc,
    schedule_time: schedule_time_utc,
  });
 
  if (!validationResult.isValid) {
    return res.status(400).json({
      status: false,
      message: validationResult.message,
    });
  }
  const formatJson = format && Array.isArray(format) && format.length > 0 ? JSON.stringify(format) : null;
  const recipientsJson = recipients && Array.isArray(recipients) && recipients.length > 0 ? JSON.stringify(recipients) : null;
  // Proceed with creating the rule
  try {
    const sql = `
      INSERT INTO rules (
        user_id,
        rule_name,
        from_time,
        to_time,
        schedule_time,
        format,
        allowed_file_size,
        recipients,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
 
    const values = [
      userId,
      rule_name,
      from_time_utc,
      to_time_utc,
      schedule_time_utc,
      formatJson,
      sizeInbytes, // Convert MB to bytes
      recipientsJson,
      created_at
    ];
 
    const [result] = await db.query(sql, values);
 
    // Convert UTC times to IST using the convertToIndianTime() function
    const from_time_ist = from_time_utc ? convertToIndianTime(from_time_utc) : null;
    const to_time_ist = to_time_utc ? convertToIndianTime(to_time_utc) : null;
    const schedule_time_ist = schedule_time_utc ? convertToIndianTime(schedule_time_utc) : null
 
    return res.status(201).json({
      status: true,
      message: "Rule created successfully.",
      data: {
        id: result.insertId, // ID of the inserted rule
        user_id: userId,
        rule_name,
        ...(from_time_ist && { from_time: from_time_ist }),
        to_time: to_time_ist,
        schedule_time: schedule_time_ist,
        format,
        allowed_file_size,
        recipients,
        created_at
      }
    });
  } catch (error) {
    console.error("Error creating rule:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error.",
    });
  }
 
 
});

const shareFilesUsingRules = asyncHandler(async (req, res) => {
  const db = await connectDB();
  const folder = "IN";
  const { receiverids, files, ruleIds } = req.body;
  // Input Validation
  if (!ruleIds || !Array.isArray(ruleIds) || ruleIds.length === 0) {
    return res.status(400).json({
      status: false,
      message: "At least one Rule ID is required.",
    });
  }

 
  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({
      status: false,
      message: "File must be selected.",
    });
  }
 
  // Fetch all rules based on ruleIds
  let rules = [];
  try {
    const [rulesResults] = await db.query(
      `SELECT id, from_time, to_time, schedule_time, allowed_file_size, format, recipients FROM rules WHERE id IN (?)`,
      [ruleIds]
    );
 
    if (rulesResults.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No rules found for the provided Rule IDs.",
      });
    }
 
    // Parse and normalize rules
    rules = rulesResults.map((rule) => ({
      id: rule.id,
      from_time: rule.from_time ? new Date(rule.from_time).toISOString() : null,
      to_time: rule.to_time ? new Date(rule.to_time).toISOString() : null,
      schedule_time: rule.schedule_time
        ? new Date(rule.schedule_time).toISOString()
        : null,
      allowed_file_size: rule.allowed_file_size || null,
      format: rule.format ?
        (Array.isArray(rule.format) ? rule.format : JSON.parse(rule.format))
        : null,
      recipients: rule.recipients ?
       (Array.isArray(rule.recipients)  ? rule.recipients :  JSON.parse(rule.recipients)) : null
 
    }));

  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to fetch rules.",
      error: error.message,
    });
  }
 
  // Combine allowed formats from all rules
  const allowedFormats = new Set();
rules.forEach(rule => {
  if (Array.isArray(rule.format)) {
    rule.format.forEach(format => {
      allowedFormats.add(format.toLowerCase());
    });
  }
});
  // Get maximum allowed file size from all rules
  const maxAllowedFileSize = Math.max(
    ...rules
      .map(rule => rule.allowed_file_size)
      .filter(size => size !== null)
  );
 
  // Combine unique recipients from all rules
  const combinedRecipients = new Set();
  rules.forEach(rule => {
    if (rule.recipients && Array.isArray(rule.recipients)) {
      rule.recipients.forEach(recipient => combinedRecipients.add(recipient));
    }
  });

 
  // File Validation
  const invalidFiles = [];
  const validFiles = [];
  const currentTime = new Date().toISOString();
 
  for (const file of files) {
    let satisfiesRules = true;
    let failureReasons = [];
 
    // Validate time constraints across all rules
    for (const rule of rules) {
      const timeValidation = validateTimeInputs({
        from_time: rule.from_time,
        to_time: rule.to_time,
        schedule_time: rule.schedule_time,
      });
 
      if (!timeValidation.isValid) {
        satisfiesRules = false;
        failureReasons.push(`Time validation failed: ${timeValidation.message}`);
        break;
      }
    }
   
    // Validate file size against maximum allowed size
    if (maxAllowedFileSize > 0) { 
      if (file.file_size > maxAllowedFileSize) {
        satisfiesRules = false;
        failureReasons.push(
          `File size exceeds maximum allowed size of ${maxAllowedFileSize} bytes`
        );
      }
    }
   
    // Validate file format against combined allowed formats
    if (allowedFormats.size > 0) {
      const fileFormat = file.format ? file.format.toLowerCase() : null;
      if (!fileFormat || !allowedFormats.has(fileFormat)) {
        satisfiesRules = false;
        failureReasons.push(
          `Invalid format (allowed: ${Array.from(allowedFormats).join(", ")})`
        );
      }
    }
    // Add file to valid or invalid list
    if (satisfiesRules) {
      validFiles.push(file);
    } else {
      invalidFiles.push({
        file_name: file.file_name,
        reasons: failureReasons,
      });
    }
  }
 
  // If there are invalid files, return an error message
  if (invalidFiles.length > 0) {
    const invalidFileMessages = invalidFiles
      .map(
        (file) =>
          `File "${file.file_name}" failed validation due to: ${file.reasons.join(
            "; "
          )}`
      )
      .join("\n");
    return res.status(400).json({
      status: false,
      message: `Some files failed validation:\n${invalidFileMessages}`,
    });
  }
 
  // Combine provided receiverids with unique recipients from rules
  const allReceivers = new Set([...receiverids, ...combinedRecipients]);

  if (allReceivers.size === 0) {
    return res.status(400).json({
      status: false,
      message: "At least one Receiver is required.",
    });
  }

  
 
  // Continue processing valid files
  const created_at = new Date().toISOString();
  const updated_at = new Date().toISOString();
 
  const insertPromises = validFiles.map((file) =>
    Array.from(allReceivers).map((receiverid) =>
      db.query(
        `INSERT INTO sharefiles (sender_id, sender_name, user_id, file_url, file_name, file_size, format, folder, from_time, to_time, schedule_time, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.user_id,
          `${req.user.first_name} ${req.user.last_name}`,
          receiverid,
          file.file_url,
          file.file_name,
          file.file_size,
          file.format || null,
          folder,
          rules[0].from_time || null,
          rules[0].to_time || null,
          rules[0].schedule_time || null,
          rules[0].schedule_time ? "pending" : "completed",
          created_at,
          updated_at,
        ]
      )
    )
  ).flat();
 
  // Execute all insert queries
  try {
    await Promise.all(insertPromises);
 
    return res.status(200).json({
      success: true,
      message: `${validFiles.length} file(s) successfully shared with ${allReceivers.size} user(s).`,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal Server Error.",
      error: error.message,
    });
  }
});

const getAllUserRules = asyncHandler(async (req, res) => {
  const db = await connectDB();
  const user_id = req.user.user_id;
 
  try {
    // Fetch all rules created by the user
    const [rules] = await db.query(
      `SELECT *
       FROM rules
       WHERE user_id = ?`,
      [user_id]
    );
 
    if (!rules || rules.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No rules found for the user",
      });
    }

    // Fetch all users data once
    const [users] = await db.query(
      `SELECT user_id, first_name, last_name 
       FROM users`
    );

    // Create a map of user details for quick lookup
    const userMap = new Map(
      users.map(user => [user.user_id, { 
        first_name: user.first_name, 
        last_name: user.last_name 
      }])
    );
 
    const rulesdata = rules.map(rule => {
      // Initialize recipients array
      let recipientsList = [];

      // Handle recipients field (array or null)
      if (rule.recipients && Array.isArray(rule.recipients)) {
        recipientsList = [...rule.recipients];
      } else if (rule.recipients && typeof rule.recipients === 'string') {
        try {
          recipientsList = JSON.parse(rule.recipients);
        } catch (e) {
          console.error(`Error parsing recipients for rule ${rule.id}:`, e);
        }
      }

      // Handle recipients1 field (single value or empty array)
      if (rule.recipients1) {
        if (Array.isArray(rule.recipients1) && rule.recipients1.length > 0) {
          recipientsList = [...recipientsList, ...rule.recipients1];
        } else if (typeof rule.recipients1 === 'number') {
          recipientsList.push(rule.recipients1);
        }
      }

      // Remove duplicates
      recipientsList = [...new Set(recipientsList)];

      // Add recipient details
      const recipientsWithDetails = recipientsList.map(recipientId => {
        const userDetails = userMap.get(recipientId);
        return {
          user_id: recipientId,
          first_name: userDetails?.first_name || 'Unknown',
          last_name: userDetails?.last_name || 'User'
        };
      });

      // console.log("recipientsWithDetails", recipientsWithDetails);
      return {
        ...rule,
        from_time: convertToIndianTime(rule.from_time),
        to_time: convertToIndianTime(rule.to_time),    
        schedule_time: convertToIndianTime(rule.schedule_time),
        recipients1: recipientsWithDetails
      };
    });
 
    // console.log("rulesdata", rulesdata);
    return res.status(200).json({
      success: true,
      message: "User rules fetched successfully",
      data: rulesdata,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

const updateUserRule = asyncHandler(async (req, res) => {
  const db = await connectDB();
  const userId = req.user.user_id;
  const { id } = req.params;

 
  if (!userId) {
    return res.status(400).json({ message: "Invalid userId" });
  }
  if (!id) {
    return res.status(400).json({ message: "Rule ID is required." });
  }
 
  const {
    rule_name,
    from_time,
    to_time,
    schedule_time,
    format,
    allowed_file_size,
    recipients,
  } = req.body;

  if (
    !(
      from_time || 
      to_time ||
      schedule_time ||
      format ||
      allowed_file_size ||
      recipients
    )
  ) {
    return res
      .status(400)
      .json({ message: "At least one type of rule is required." });
  }

  const sizeInbytes = allowed_file_size * 1024 * 1024;

  const from_time_utc = from_time ? new Date(from_time).toISOString() : null;
  const to_time_utc = to_time ? new Date(to_time).toISOString() : null;
  const schedule_time_utc = schedule_time ? new Date(schedule_time).toISOString() : null;
  const updated_at = new Date().toISOString();
 
  // Validate time-related inputs
  const validationResult = validateTimeInputs({
    from_time: from_time_utc,
    to_time: to_time_utc,
    schedule_time: schedule_time_utc,
  });
  if (!validationResult.isValid) {
    return res.status(400).json({ status: false, message: validationResult.message });
  }
 
  const formatJson = format && Array.isArray(format) && format.length > 0 ? JSON.stringify(format) : null;
  const recipientsJson = recipients && Array.isArray(recipients) && recipients.length > 0 ? JSON.stringify(recipients) : null;
 
  try {
    // Fetch existing rule
    const [existingRules] = await db.query("SELECT * FROM rules WHERE id = ? AND user_id = ?", [id, userId]);
    if (existingRules.length === 0) {
      return res.status(404).json({ status: false, message: "Rule not found." });
    }
 
    const existingRule = existingRules[0];
 
    // Update only provided fields, keeping existing values for others
    const sql = `
      UPDATE rules SET
        rule_name = ?,
        from_time = ?,
        to_time = ?,
        schedule_time = ?,
        format = ?,
        allowed_file_size = ?,
        recipients = ?,
        updated_at = ?
      WHERE id = ? AND user_id = ?
    `;
 
    const values = [
      rule_name  ,
      from_time_utc ,
      to_time_utc,
      schedule_time_utc,
      formatJson,
      sizeInbytes,
      recipientsJson ,
      updated_at,
      id,
      userId,
    ];
 
    await db.query(sql, values);
 
    return res.status(200).json({
      status: true,
      message: "Rule updated successfully.",
    });
  } catch (error) {
    console.error("Error updating rule:", error);
    return res.status(500).json({ status: false, message: "Internal server error." });
  }
});

const deleteUserRule = asyncHandler(async (req, res) => {
  const db = await connectDB();
  const userId = req.user.user_id;
  const { id } = req.params;

 
  if (!userId) {
    return res.status(400).json({ message: "Invalid userId" });
  }
  if (!id) {
    return res.status(400).json({ message: "Rule ID is required." });
  }
 
  try {
    // Check if the rule exists
    const [existingRules] = await db.query("SELECT * FROM rules WHERE id = ? AND user_id = ?", [id, userId]);
    if (existingRules.length === 0) {
      return res.status(404).json({ status: false, message: "Rule not found." });
    }
 
    // Delete the rule
    await db.query("DELETE FROM rules WHERE id = ? AND user_id = ?", [id, userId]);
 
    return res.status(200).json({
      status: true,
      message: "Rule deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting rule:", error);
    return res.status(500).json({ status: false, message: "Internal server error." });
  }
});

export {
  shareFiles,
  newUserRule,
  shareFilesUsingRules,
  getAllUserRules,
  updateUserRule,
  deleteUserRule,
};

