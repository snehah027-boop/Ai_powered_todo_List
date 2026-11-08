const mongoose = require("mongoose");
const dns = require("dns");

// Force IPv4 and use Google public DNS to resolve MongoDB Atlas SRV records
dns.setServers(["8.8.8.8", "8.8.4.4"]);
dns.setDefaultResultOrder("ipv4first");

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

const connectDB = async (attempt = 1) => {
    try {
        const conn = await mongoose.connect(
            process.env.MONGO_URL,
            {
                serverSelectionTimeoutMS: 15000,
                family: 4,
            }
        );

        console.log(
            "MongoDB Connected Successfully:",
            conn.connection.host
        );

    } catch (error) {
        console.error(
            `MongoDB Connection Error (attempt ${attempt}/${MAX_RETRIES}):`,
            error.message
        );

        if (attempt < MAX_RETRIES) {
            console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
            setTimeout(() => connectDB(attempt + 1), RETRY_DELAY_MS);
        } else {
            console.error(
                "Failed to connect to MongoDB after multiple retries. " +
                "The server will stay running but database features will be unavailable."
            );
            // Do NOT call process.exit(1) — keep the server alive
        }
    }
};

module.exports = connectDB;
