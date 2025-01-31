const User = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

//create user
const CreateUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        //check if user exists
        const existingUser = await User.findOne({ email });

        //if user exists return with error message
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        //encrypt user password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });

        const token = jwt.sign({ id: newUser._id }, process.env.TOKEN_SECRET);

        //save user to database
        await newUser.save();
        res
        .cookie("token", token, { httpOnly: true })
        .status(201)
        .json({ message: "User account created successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error, please try again.");
    }
}

//authenticate user
const AuthenticateUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(500).json({ message: "Bad request. Please provide your credentials."});
        }

        //check if user exists
        const findUser = await User.findOne({ email });

        if (!findUser) {
            return res.status(400).json({ message: "Invalid credentials, please try again or signup." });
        }

        //validate user password
        const validatePassword = await bcrypt.compare(password, findUser.password);

        if (!validatePassword) {
            return res.status(400).json({ message: "Invalid credentials, please try again or signup." });
        }

        res.status(200).json({ message: "User authenticated successfully!", data: findUser });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error, please try again.");
    }
}

//update user
const UpdateUser = async (req, res) => {
    try {
        const { id: userId } = req.params;
        const { username, email, password, currentPassword } = req.body;
        
        //verify user exists
        const existingUser = await User.findById(userId);
        if (!existinUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify user has permission (assuming req.user.id comes from auth middleware)
        if (userId !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to update this user" });
        }

        // Create update object
        const updates = {};

        // Handle username update
        if (username && username !== existingUser.username) {
            if (username.length < 3) {
                return res.status(400).json({ message: "Username must be at least 3 characters long" });
            }
            updates.username = username;
        }

        //handle email update
        if (email && email !== existingUser.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ message: "Invalid email format" });
            }
            
            //check if new email already exists
            const emailExists = await User.findOne({ email, _id: { $ne: userId } });
            if (emailExists) {
                return res.status(400).json({ message: "Email already in use" });
            }
            updates.email = email;
        }

        //handle password update
        if (password) {
            //require current password
            if (!currentPassword) {
                return res.status(400).json({ message: "Current password is required to update password" });
            }

            //verify current password
            const isPasswordValid = await bcrypt.compare(currentPassword, existingUser.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: "Current password is incorrect" });
            }

            //validate new password
            if (password.length < 8) {
                return res.status(400).json({ message: "New password must be at least 8 characters long" });
            }

            //hash new password
            updates.password = await bcrypt.hash(password, 10);
        }

        //no valid updates provided
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "No valid updates provided" });
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password'); //exclude password from response

        // Generate new token if email was updated
        let newToken = null;
        if (updates.email) {
            newToken = jwt.sign(
                { id: updatedUser._id },
                process.env.TOKEN_SECRET,
                { expiresIn: "24h" }
            );
        }

        //ready response
        const response = {
            message: "User updated successfully",
            user: updatedUser
        };

        //if email was updated, send new token
        if (newToken) {
            res.cookie("token", newToken, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000
            });
        }

        res
        .status(201)
        .json(response);

    } catch (error) {
        console.error("Update user error:", error);
        res.status(500).json({ message: "Server error while updating user" });
    }
};

//get single user
const GetSingleUser = async (req, res) => {
    try {
        const { id: userId } = req.params;

        // Find user and exclude password from the response
        const existingUser = await User.findById(userId)

        // Check if user exists
        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(201).json(existingUser);

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: "Server error while fetching user" });
    }
};

//delete user
const DeleteUser = async (req, res) => {
    try {
        const { email } = req.body;

        //check if user exists
        const findUser = await User.findOne({ email });

        //if user does not exist return with error message
        if (!findUser) {
            return res.status(400).json({ message: "User not found." });
        }

        //delete user by email
        await User.findOneAndDelete({ email });
        res.status(201).json({ message: "User deleted successfully!"});
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error, please try again.");
    }
}


module.exports = { 
    CreateUser,
    AuthenticateUser,
    UpdateUser,
    GetSingleUser,
    DeleteUser
};