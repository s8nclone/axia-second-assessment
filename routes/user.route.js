const express = require("express");
const {
    CreateUser,
    AuthenticateUser,
    UpdateUser,
    GetSingleUser,
    DeleteUser
} = require("../controllers/userAuth.controller");

//initialize express router
const routes = express.Router();

//define routes
routes.get("/user", GetSingleUser);
routes.post("/signup", CreateUser);
routes.post("/login", AuthenticateUser);
routes.patch("/update", UpdateUser);
routes.delete("/delete", DeleteUser);

module.exports = routes;