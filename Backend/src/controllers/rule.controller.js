import connectDB from "../db/db.js";
import asyncHandler from "../utils/asyncHandler.js";

const validateTimeInputs = ({ from_time, to_time, schedule_time }) => {
  const currentDate = new Date(); // Current time in UTC
  console.log("Current Date:", currentDate);

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
    console.log("to_time:", toTime); 
    console.log(currentDate) // Debugging log to verify to_time
    if (toTime < currentDate) {
      console.log("in if block")
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

  // Convert provided times to UTC, or default to null
  const utcFromTime = from_time ? new Date(from_time).toISOString() : null;
  const utcToTime = to_time ? new Date(to_time).toISOString() : null;
  const utcScheduleTime = schedule_time ? new Date(schedule_time).toISOString() : null;

  // Check if receiver IDs are provided
  if (!receiverids || !Array.isArray(receiverids) || receiverids.length === 0) {
    return res.status(400).json({ status: false, message: "Select User" });
  }

  // Check if files are provided
  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ status: false, message: "File must be selected" });
  }

  // Validate file fields
  for (const file of files) {
    file.format = file.format ?? null;
    if (!(file.file_url && file.file_name && file.file_size && file.resource_type)) {
      return res.status(400).json({ status: false, message: "All file fields must be provided" });
    }
  }

  // Prepare times for validation
  const validTimes = {
    from_time: utcFromTime,
    to_time: utcToTime,
    schedule_time: utcScheduleTime,
  };

  console.log(validTimes)
  // Validate times only if they are provided
  const validationResult = validateTimeInputs(validTimes);
  console.log(validationResult)

  if (!validationResult.isValid) {
    console.log("Validation failed:", validationResult.message);
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
         (sender_id, sender_name, user_id, file_url, file_name, file_size, resource_type, format, folder, from_time, to_time, schedule_time, created_at, updated_at, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sender_id,
          sender_name,
          receiverid,
          file.file_url,
          file.file_name,
          file.file_size,
          file.resource_type,
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
    file_type,
    allowed_file_size,
    recipients,
  } = req.body;

  if (!rule_name) {
    return res.status(400).json({ message: "Rule name is required." });
  }

  // Check if at least one type of rule data is provided
  if (
    !(
      (from_time && to_time) ||
      schedule_time ||
      file_type ||
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

  // Proceed with creating the rule
  try {
    const sql = `
      INSERT INTO rules (
        user_id,
        rule_name,
        from_time,
        to_time,
        schedule_time,
        file_type,
        allowed_file_size,
        recipients,
        created_at
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      userId,                // User ID
      rule_name,             // Rule name
      from_time_utc,         // From time (UTC)
      to_time_utc,           // To time (UTC)
      schedule_time_utc,     // Schedule time (UTC)
      file_type,             // File type
      allowed_file_size,     // Allowed file size
      recipients,            // Recipients
      created_at             // Created at timestamp
    ];

    const [result] = await db.query(sql, values);

    return res.status(201).json({
      status: true,
      message: "Rule created successfully.",
      data: {
        id: result.insertId, // ID of the inserted rule
        user_id: userId,
        rule_name,
        from_time: from_time_utc,
        to_time: to_time_utc,
        schedule_time: schedule_time_utc,
        file_type,
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
  const {
    receiverids,
    files, // Array of files with properties: file_url, file_name, file_size, resource_type, from_time, to_time
    ruleId,
  } = req.body;


  if (!ruleId) {
    return res.status(400).json({
      status: false,
      message: "Rule ID is required",
    });
  }

  if (!receiverids || !Array.isArray(receiverids) || receiverids.length === 0) {
    return res.status(400).json({
      status: false,
      message: "Select User",
    });
  }

  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({
      status: false,
      message: "File must be selected",
    });
  }

  // Validation for each file in the array
  for (const file of files) {
    if (!(file.file_url || file.file_name || file.file_size || file.resource_type || file.format)) {
      return res.status(400).json({
        status: false,
        message: "Some fields are missing in file",
      });
    }
  }

  const created_at = new Date().toISOString();
  const updated_at = new Date().toISOString();

  // Fetch the rule from the database using ruleId
  let rule;
  try {
    const [ruleResults] = await db.query(
      `SELECT from_time, to_time, schedule_time, allowed_file_size FROM rules WHERE id = ? LIMIT 1`,
      [ruleId]
    );

    const ruleResult = ruleResults[0];
    if (!ruleResult) {
      return res.status(404).json({
        status: false,
        message: "Rule not found",
      });
    }

    rule = {
      from_time: ruleResult.from_time ? new Date(ruleResult.from_time).toISOString() : null,
      to_time: ruleResult.to_time ? new Date(ruleResult.to_time).toISOString() : null,
      schedule_time: ruleResult.schedule_time ? new Date(ruleResult.schedule_time).toISOString() : null,
      allowed_file_size: ruleResult.allowed_file_size || null, // May be null if not specified
    };
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to fetch rule",
      error: error.message,
    });
  }

  // Validate files against the allowed file size (if specified)
  let validFiles = files;
  if (rule.allowed_file_size) {
    const oversizedFiles = files.filter((file) => file.file_size > rule.allowed_file_size);

    if (oversizedFiles.length > 0) {
      const oversizedFileNames = oversizedFiles.map((file) => file.file_name).join(", ");
      return res.status(400).json({
        status: false,
        message: `The following file(s) exceed the allowed file size of ${rule.allowed_file_size} bytes: ${oversizedFileNames}`,
      });
    }

    validFiles = files.filter((file) => file.file_size <= rule.allowed_file_size);
    console.log(validFiles)
  }

  // Validate time inputs
  const validationResult = validateTimeInputs(rule);

  if (!validationResult.isValid) {
    return res.status(400).json({
      status: false,
      message: validationResult.message,
    });
  }

  // Prepare insert promises for each combination of valid file and receiver
  const insertPromises = [];

  validFiles.forEach((file) => {
    receiverids.forEach((receiverid) => {
      const status = rule.schedule_time ? "pending" : "completed";
      insertPromises.push(
        db.query(
          `INSERT INTO sharefiles (sender_id, sender_name, user_id, file_url, file_name, file_size, resource_type, format, folder, from_time, to_time, schedule_time, status, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            req.user.user_id,
            `${req.user.first_name} ${req.user.last_name}`,
            receiverid,
            file.file_url,
            file.file_name,
            file.file_size,
            file.resource_type,
            file.format || null, // Optional format
            folder,
            rule.from_time,
            rule.to_time,
            rule.schedule_time,
            status,
            created_at,
            updated_at,
          ]
        )
      );
    });
  });

  try {
    // Execute all insertions in parallel
    await Promise.all(insertPromises);

    return res.status(200).json({
      success: true,
      message: `${validFiles.length} file(s) successfully shared with ${receiverids.length} user(s) using the rule constraints.`,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
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

    // Send back the rules in the response
    return res.status(200).json({
      success: true,
      message: "User rules fetched successfully",
      data: rules,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
})

export {
  shareFiles,
  newUserRule,
  shareFilesUsingRules,
  getAllUserRules
};

