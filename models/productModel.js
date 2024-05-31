// Importing Mongoose library
const mongoose = require("mongoose");

// Defining a Mongoose schema for the product
const productSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  dateOfSale: Date,
  category: String,
  sold: Boolean,
});
// Exporting the Mongoose model using the schema
module.exports = mongoose.model("Product", productSchema);
