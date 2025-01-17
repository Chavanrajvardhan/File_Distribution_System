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
