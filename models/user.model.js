const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, "email is required"],
        unique: true,
    },
    password: {
        type: String,
        required: [true, "password is required"],
        minlength: [6, "password must be at least 6 characters long"]
    }
}, {timestamps: true});

module.exports = mongoose.model("user", UserSchema);