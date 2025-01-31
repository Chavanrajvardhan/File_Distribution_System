// Cron job to process scheduled tasks
import connectDB from "../db/db.js";
import cron from "node-cron"
export const scheduleFiles = async () => {
    const db = await connectDB();
 
    cron.schedule("* * * * *", async () => { // Runs every minute
  
        try {
            // --- 1. Process Pending File Sharing Tasks ---
            const [tasks] = await db.query(
                "SELECT * FROM sharefiles WHERE schedule_time <= UTC_TIMESTAMP() AND status = 'pending'"
            );
 
            for (const task of tasks) {
                const { id, user_id, file_name } = task;
 
                try {
                    console.log(`Sharing file: ${file_name} with user ID: ${user_id}`);
 
                    // Simulate file-sharing logic
                    // await shareFileWithUser(user_id, file_name);
 
                    await db.query(
                        "UPDATE sharefiles SET status = 'completed' WHERE id = ? AND status = 'pending'",
                        [id]
                    );
 
                    console.log(`Task ${id} completed.`);
                } catch (error) {
                    console.error(`Failed to process task ${id}:`, error.message);
                    await db.query("UPDATE sharefiles SET status = 'failed' WHERE id = ?", [id]);
                }
            }
 
            // --- 2. Permanently Delete Files Older Than 7 Days ---
            const [deletedFiles] = await db.query(
                `DELETE FROM files
                 WHERE delete_flag = TRUE  
                 AND STR_TO_DATE(deleted_at, '%Y-%m-%dT%H:%i:%s.%fZ') < UTC_TIMESTAMP() - INTERVAL 7 DAY`
            );
 
        } catch (error) {
            console.error("Error processing scheduled tasks:", error.message);
        }
    });
};

