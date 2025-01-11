// Cron job to process scheduled tasks
export const scheduleFiles = async () => {
    const db = await connectDB();

    cron.schedule("* * * * *", async () => {
        console.log("Checking for scheduled tasks...");

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
                    console.log(`Sharing file: ${file_name} with user ID: ${user_id}`);

                    // Update the task status to 'completed'
                    await db.query("UPDATE sharefiles SET status = 'completed' WHERE user_id = ?", [user_id]);

                    console.log(`Task ${id} completed.`);
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

// Start the cron job
scheduleCronJob();