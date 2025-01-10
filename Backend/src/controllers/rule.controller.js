import connectDB from "../db/db.js";
import asyncHandler from "../utils/asyncHandler.js";

const validateTimeBound = (from_time, to_time) => {
  from_time = new Date(from_time);
  to_time = new Date(to_time);
  const currentDate = new Date(); // Current time in UTC

  if (from_time < currentDate) {
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
      message: `${receiverids.length} file(s) successfully shared with time-bound restrictions`,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

export { shareWithTimeBoundRule };
