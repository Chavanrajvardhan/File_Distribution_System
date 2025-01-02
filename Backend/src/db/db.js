import mysql from "mysql2/promise";
//db connection
let pool;

const connectDB = async () => {
    if (!pool) {
        try {
            pool = mysql.createPool({
                host: process.env.HOST,
                user: process.env.USER,
                password: process.env.PASSWORD, // Make sure this is uncommented for production
                database: process.env.DBNAME,
            });

            await pool.getConnection(); 
            console.log("\nMySQL connection pool created!");

        } catch (error) {
            console.error("MySQL connection FAILED", error);
            throw error;
        }
    }
    return pool;
};

export default connectDB;