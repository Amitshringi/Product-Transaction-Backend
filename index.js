// Importing required modules
const express = require("express");
const port = 5000;
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const axios = require("axios"); // HTTP client for making requests
const productRoutes = require("./routes/productRoutes"); // Importing product routes
require("dotenv").config(); // Loading environment variables

// Creating an Express application
const app = express();

// Middleware setup
app.use(cors());
app.use(bodyParser.json());

// Connecting to MongoDB Atlas
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB Atlas", err);
  });

// Routes setup
app.use("/", productRoutes); // Mounting product routes

// Start the server and listen on specified port
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
