// Cron job to process scheduled tasks
import connectDB from "../db/db.js";
import cron from "node-cron"
export const scheduleFiles = async () => {
    const db = await connectDB();

    cron.schedule("* * * * *", async () => {

        try {
            // Fetch pending tasks whose schedule_time has passed
            const [tasks] = await db.query(
                "SELECT * FROM sharefiles WHERE schedule_time <= UTC_TIMESTAMP()  AND status = 'pending'"
            );
            
            for (const task of tasks) {
                const {
                    id,
                    user_id,
                    file_name,
                } = task;

                try {
                    // Simulate file-sharing logic
                    // Update the task status to 'completed'
                    await db.query(
                        "UPDATE sharefiles SET status = 'completed' WHERE id = ? AND status = 'pending'",
                        [id]
                      );
                } catch (error) {
                    console.error(`Failed to process task ${id}:`, error.message);

                    // Update the task status to 'failed'
                    await db.query("UPDATE sharefiles SET status = 'failed' WHERE user_id = ?", [user_id]);
                }
            }
        } catch (error) {
            console.error("Error fetching scheduled tasks:", error.message);
        }
    });
};

