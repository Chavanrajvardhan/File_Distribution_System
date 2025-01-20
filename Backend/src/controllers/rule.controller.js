import connectDB from "../db/db.js";
import asyncHandler from "../utils/asyncHandler.js";

const validScheduleTime = (scheduleTime) => {
  scheduleTime = new Date(scheduleTime);
  const currentDate = new Date();
 
  if (scheduleTime < currentDate) {
    return {
      isValid: false,
      message: "Schedule time  can't be in the past.",
    };
  }
 
  return { isValid: true };
 
}

const validateTimeBound = (from_time, to_time) => {
  from_time = new Date(from_time);
  to_time = new Date(to_time);
  const currentDate = new Date(); // Current time in UTC

  if (from_time < currentDate) {
    console.log("from time less");
    return {
      isValid: false,
      message: "File sharing start time can't be in the past.",
    };
  }

  if (to_time < currentDate) {
    return {
      isValid: false,
      message: "File sharing end time can't be in the past.",
    };
  }

  if (from_time > to_time) {
    return {
      isValid: false,
      message: "End time must be after the start time.",
    };
  }

  return { isValid: true };
};

const validScheduleTime = (scheduleTime) => {
  scheduleTime = new Date(scheduleTime);
  const currentDate = new Date();

  if (scheduleTime < currentDate) {
    return {
      isValid: false,
      message: "Schedule time  can't be in the past.",
    };
  }

  return { isValid: true };

}
const shareWithTimeBoundRule = asyncHandler(async (req, res) => {
  const db = await connectDB();
  const sender_id = req.user.user_id;
  const sender_name = req.user.first_name + " " + req.user.last_name;
  const {
    receiverids,
    file_url,
    file_name,
    file_size,
    resource_type,
    from_time,
    to_time,
  } = req.body;
  const format = null; // To be handled later
  const folder = "IN";


  console.log(from_time, to_time);
  if (!(receiverids && file_url && file_name && file_size && resource_type)) {
    return res.status(400).json({
      status: false,
      message: "All fields are required",
    });
  }

  if (!Array.isArray(receiverids) || receiverids.length === 0) {
    return res.status(400).json({
      status: false,
      message: "Receiver IDs must be an array and cannot be empty",
    });
  }

  // Convert local time to UTC
  const from_time_utc = from_time ? new Date(from_time).toISOString() : null;
  const to_time_utc = to_time ? new Date(to_time).toISOString() : null;

  // Validate time-bound rule if from_time and to_time are provided
  if (from_time_utc || to_time_utc) {
    const validationResult = validateTimeBound(from_time_utc, to_time_utc);
    if (!validationResult.isValid) {
      console.log(validationResult.message);
      return res.status(400).json({
        status: false,
        message: validationResult.message,
      });
    }
  }

  const created_at = new Date().toISOString();
  const updated_at = new Date().toISOString();

  const insertPromises = receiverids.map((receiverid) => {
    return db.query(
      `INSERT INTO sharefiles (sender_id,sender_name, user_id, file_url, file_name, file_size, resource_type, format, folder, from_time, to_time, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sender_id,
        sender_name,
        receiverid,
        file_url,
        file_name,
        file_size,
        resource_type,
        format,
        folder,
        from_time_utc,
        to_time_utc,
        created_at,
        updated_at,
      ]
    );
  });

  try {
    // Execute all insertions in parallel
    const results = await Promise.all(insertPromises);

    return res.status(200).json({
      success: true,
      message: `file(s) successfully shared with time-bound restrictions to ${receiverids.length} receiver(s)`,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});


const scheduleFilesToShare = asyncHandler(async (req, res) => {
  const db = await connectDB();

  const sender_id = req.user.user_id;
  const sender_name = req.user.first_name + " " + req.user.last_name;
  const { receiverids, file_url, file_name, file_size, resource_type, schedule_time } = req.body;

  // Validate inputs
  if (!(sender_id || Array.isArray(receiverids) || receiverids.length === 0 || file_url || file_name || file_size || resource_type || schedule_time)) {
    return res.status(400).json({
      success: false,
      message: "All fields are required, and receiver_ids must be a non-empty array."
    });
  }

  // Convert local time to UTC
  const schedule_time_utc = schedule_time ? new Date(schedule_time).toISOString() : null;

  if (schedule_time) {
    const validationResult = validScheduleTime(schedule_time_utc);
    if (!validationResult.isValid) {
      return res.status(400).json({
        status: false,
        message: validationResult.message,
      });
    }
  }

  try {

    const created_at = new Date().toISOString()
    const updated_at = new Date().toISOString()

    const status = 'pending'
    // Insert a task for each receiver
    const insertPromises = receiverids.map((receiver_id) =>
      db.query(
        `INSERT INTO sharefiles 
                 (sender_id, sender_name,user_id, file_url, file_name, file_size, resource_type, schedule_time, status, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)`,
        [
          sender_id,
          sender_name,
          receiver_id,
          file_url,
          file_name,
          file_size,
          resource_type,
          schedule_time_utc,
          status,
          created_at,
          updated_at,
        ]
      )
    );

    // Execute all insertions in parallel
    await Promise.all(insertPromises);

    res.status(201).json({
      success: true,
      message: `${receiverids.length} task(s) scheduled successfully.`,
    });
  } catch (error) {
    console.error("Error scheduling tasks:", error.message);
    res.status(500).json({ success: false, message: "Error scheduling tasks.", error: error.message });
  }
})


const newUserRule = asyncHandler(async (req, res) => {
  const db = await connectDB()
  const userId = req.user.user_id;


  if (!userId) {
    return res.status(400).json({ message: 'Invalid userId' });
  }

  const { rule_name, from_time, to_time, schedule_time, file_type, allowed_file_size, recipients } = req.body;

  if (!rule_name) {
    return res.status(400).json({ message: 'Rule name is required.' });
  }

  // Check if at least one type of rule data is provided
  if (
    !((from_time && to_time) || schedule_time || file_type || allowed_file_size || recipients)
  ) {
    return res.status(400).json({ message: 'At least one type of rule is required.' });
  }

  // Convert local time to UTC
  const from_time_utc = from_time ? new Date(from_time).toISOString() : null;
  const to_time_utc = to_time ? new Date(to_time).toISOString() : null;
  const created_at = new Date().toISOString();

  // Validate time-bound rule if from_time and to_time are provided
  if (from_time_utc || to_time_utc) {
    const validationResult = validateTimeBound(from_time_utc, to_time_utc);
    if (!validationResult.isValid) {
      return res.status(400).json({
        status: false,
        message: validationResult.message,
      });
    }
  }

  // Convert schedule time to UTC
  const schedule_time_utc = schedule_time ? new Date(schedule_time).toISOString() : null;

  if (schedule_time) {
    const validationResult = validScheduleTime(schedule_time_utc);
    if (!validationResult.isValid) {
      return res.status(400).json({
        status: false,
        message: validationResult.message,
      });
    }
  }



  try {
    // Insert the rule into the database
    const query = `
        INSERT INTO rules (user_id, rule_name, from_time, to_time, schedule_time, file_type, allowed_file_size, recipients, created_at)
        VALUES (?, ?, ?, ?, ?, ?,?, ?, ?)
      `;
    const [result] = await db.execute(query, [
      userId,
      rule_name,
      from_time_utc,
      to_time_utc,
      schedule_time_utc,
      JSON.stringify(file_type),
      allowed_file_size,
      JSON.stringify(recipients),
      created_at
    ]);

    res.status(201).json({
      message: 'Rule created successfully!',
      rule: {
        id: result.insertId,
        rule_name,
        from_time: from_time_utc,
        to_time: to_time_utc,
        schedule_time: schedule_time_utc,
        file_type,
        allowed_file_size,
        recipients,
        created_at,
      },
    });


  } catch (error) {
    console.error('Error creating rule:', error);
    res.status(500).json({ message: 'Failed to create rule.' });
  }

})


const shareFilesUsingRules = asyncHandler(async (req, res) => {
  const db = await connectDB()
  const folder = "IN";
  const {
    receiverids,
    files, // Array of files with properties: file_url, file_name, file_size, resource_type, from_time, to_time
    ruleId
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
    if (!(file.file_url || file.file_name || file.file_size || file.resource_type || file.formate)) {
      return res.status(400).json({
        status: false,
        message: "Some field are missing in file",
      });
    }
  }

  const created_at = new Date().toISOString();
  const updated_at = new Date().toISOString();

  // Fetch the time-bound rule from the database using ruleId
  let rule;
  try {
    const [ruleResults] = await db.query(
      `SELECT from_time, to_time, schedule_time FROM rules WHERE id = ? LIMIT 1`,
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
      schedule_time: ruleResult.schedule_time ?  new Date(ruleResult.schedule_time).toISOString() : null,
    };


  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to fetch rule",
      error: error.message,
    });
  }

  console.log(rule.schedule_time)
  // Validate rule times
  if (rule.from_time && rule.to_time) {
    const validationResult = validateTimeBound(rule.from_time, rule.to_time);
    if (!validationResult.isValid) {
      return res.status(400).json({
        status: false,
        message: `Validation failed for rule: ${validationResult.message}`,
      });
    }
  }

  //validate schedule times
  if (rule.schedule_time) {
    const validationResult = validScheduleTime(rule.schedule_time);
    if (!validationResult.isValid) {
      return res.status(400).json({
        status: false,
        message: validationResult.message,
      });
    }
  }



  // Prepare insert promises for each combination of file and receiver
  const insertPromises = [];

  files.forEach((file) => {
    receiverids.forEach((receiverid) => {
      const status = rule.schedule_time ? "pending" : "completed";
      insertPromises.push(
        db.query(
          `INSERT INTO sharefiles (sender_id, sender_name, user_id, file_url, file_name, file_size, resource_type, format, folder, from_time, to_time, schedule_time, status,created_at, updated_at) 
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
      message: `${files.length} file(s) successfully shared with ${receiverids.length} user(s) using the rule constraints`,
    });


  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }

})


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
  shareWithTimeBoundRule,
  scheduleFilesToShare,
  newUserRule,
  shareFilesUsingRules,
  getAllUserRules
};



const scheduleFilesToShare = asyncHandler(async (req, res) => {
  const db = await connectDB();
 
  const sender_id = req.user.user_id;
  const sender_name = req.user.first_name + " " + req.user.last_name;
  const { receiverids, file_url, file_name, file_size, resource_type, schedule_time } = req.body;
 
  console.log(receiverids, file_url, file_name, file_size, resource_type, schedule_time);
  // Validate inputs
  if (!(sender_id || Array.isArray(receiverids) && receiverids.length === 0 && file_url && file_name && file_size && resource_type && schedule_time)) {
    return res.status(400).json({
      success: false,
      message: "All fields are required, and receiver_ids must be a non-empty array."
    });
  }
 
  // Convert local time to UTC
  const schedule_time_utc = schedule_time ? new Date(schedule_time).toISOString() : null;
 
  if (schedule_time) {
    const validationResult = validScheduleTime(schedule_time_utc);
    if (!validationResult.isValid) {
      return res.status(400).json({
        status: false,
        message: validationResult.message,
      });
    }
  }
 
  try {
 
    const created_at = new Date().toISOString()
    const updated_at = new Date().toISOString()
 
    const status = 'pending'
    // Insert a task for each receiver
    const insertPromises = receiverids.map((receiver_id) =>
      db.query(
        `INSERT INTO sharefiles
                 (sender_id, sender_name,user_id, file_url, file_name, file_size, resource_type, schedule_time, status, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)`,
        [
          sender_id,
          sender_name,
          receiver_id,
          file_url,
          file_name,
          file_size,
          resource_type,
          schedule_time_utc,
          status,
          created_at,
          updated_at,
        ]
      )
    );
 
    // Execute all insertions in parallel
    await Promise.all(insertPromises);
 
    res.status(201).json({
      success: true,
      message: `file(s) successfully scheduled to ${receiverids.length} receiver(s)`,
    });
  } catch (error) {
    console.error("Error scheduling tasks:", error.message);
    res.status(500).json({ success: false, message: "Error scheduling tasks.", error: error.message });
  }
})

export { 
  shareWithTimeBoundRule,
  scheduleFilesToShare
 };
