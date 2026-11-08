const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");

const {
    notFound,
    errorHandler
} = require("./middleware/errorMiddleware");



// Load environment variables

dotenv.config();



// Connect to Database

connectDB();



const app = express();



// Middlewares

// Allow requests from both common Vite dev ports and the configured FRONTEND_URL
const allowedOrigins = [
    process.env.FRONTEND_URL,
    "http://localhost:5173",
    "http://localhost:5713",
    "http://localhost:3000",
].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, curl, Postman)
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error(`CORS: origin ${origin} not allowed`));
        },
        credentials: true,
    })
);


app.use(express.json());



// Routes

app.use(
    "/api/auth",
    require("./routes/authRoutes")
);


app.use(
    "/api/todos",
    require("./routes/todoRoutes")
);


app.use(
    "/api/diary",
    require("./routes/diaryRoutes")
);


app.use(
    "/api/ai",
    require("./routes/aiRoutes")
);



// Health Check API

app.get("/health", (req, res) => {

    res.json({
        status: "OK",
        message: "Backend Server is healthy and running."
    });

});



// Error Handling Middleware

app.use(notFound);

app.use(errorHandler);



// Start Server

const PORT = process.env.PORT || 5001;


app.listen(PORT, () => {

    console.log(
        `Server running in ${
            process.env.NODE_ENV || "development"
        } mode on port ${PORT}`
    );

});