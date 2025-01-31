const mongoose = require("mongoose");
require("dotenv").config();

const connectionUri = process.env.MONGODB_URI; 

const connectDB = async () => {
    try {
        const connect = await mongoose.connect(connectionUri);
        console.log(`MongoDB Connected Successfully!: ${connect.connection.host}`);
    } catch (error) {
        console.log("MongoDB connection failed", error);
        process.exit(1);
    }
}

module.exports = connectDB;