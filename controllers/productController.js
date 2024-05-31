const axios = require("axios");
const Product = require("../models/productModel");
// const { title } = require('process');
// const { error } = require('console');

// Fetch data from API and initialize database
exports.initializeDatabase = async (req, res) => {
  try {
    const response = await axios.get(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    );
    const products = response.data;
    await Product.deleteMany({});
    await Product.insertMany(products);
    res.status(200).send("Database initialized");
  } catch (err) {
    console.error("Error initializing database:", err);
    res.status(500).send("Error initializing database");
  }
};

// List all transactions with search and pagination
exports.listTransactions = async (req, res) => {
  console.log(req, "Request");
  const { search = "", page = 1, perPage = 10, month } = req.query;

  // Validate month parameter
  const monthInt = parseInt(month);
  if (!month || isNaN(monthInt) || monthInt < 1 || monthInt > 12) {
    return res.status(400).json({ error: "Invalid month parameter" });
  }

  const start = new Date(`2022-${monthInt.toString().padStart(2, "0")}-01`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  // Construct the query
  const query = {
    dateOfSale: { $gte: start, $lt: end },
    $or: [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ],
  };

  // If the search term can be converted to a number, add it to the query
  const searchAsNumber = parseFloat(search);
  if (!isNaN(searchAsNumber)) {
    query.$or.push({ price: searchAsNumber });
  }

  try {
    const totalCount = await Product.countDocuments(query);
    const transactions = await Product.find(query)
      .skip((page - 1) * perPage)
      .limit(parseInt(perPage));

    res.status(200).json({
      totalCount: totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / perPage),
      transactions: transactions,
    });
  } catch (err) {
    console.error("Error listing transactions:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

//get statistics for a specific month
exports.statisticsByMonth = async (req, res) => {
  const month = req.params.month;
  const start = new Date(`2022-${month}-01`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  try {
    const totalSaleAmount = await Product.aggregate([
      { $match: { dateOfSale: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: "$price" } } },
    ]);

    const totalSoldItems = await Product.countDocuments({
      dateOfSale: { $gte: start, $lt: end },
      sold: true,
    });

    const totalNotSoldItems = await Product.countDocuments({
      dateOfSale: { $gte: start, $lt: end },
      sold: false,
    });

    res.status(200).json({
      totalSaleAmount: totalSaleAmount[0]?.total || 0,
      totalSoldItems,
      totalNotSoldItems,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server error" });
  }
};

// Get bar chart data for a specific month
exports.getBarChartData = async (req, res) => {
  const month = req.params.month;
  const start = new Date(`2022-${month}-01`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const priceRanges = [
    { range: "0-100", min: 0, max: 100 },
    { range: "101-200", min: 101, max: 200 },
    { range: "201-300", min: 201, max: 300 },
    { range: "301-400", min: 301, max: 400 },
    { range: "401-500", min: 401, max: 500 },
    { range: "501-600", min: 501, max: 600 },
    { range: "601-700", min: 601, max: 700 },
    { range: "701-800", min: 701, max: 800 },
    { range: "801-900", min: 801, max: 900 },
    { range: "901-above", min: 901, max: Infinity },
  ];

  try {
    const result = await Promise.all(
      priceRanges.map(async (range) => {
        const count = await Product.countDocuments({
          dateOfSale: { $gte: start, $lt: end },
          price: { $gte: range.min, $lt: range.max },
        });
        return { range: range.range, count };
      })
    );
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get pie chart data for a specific month
exports.getPieChartData = async (req, res) => {
  const month = req.params.month;
  const start = new Date(`2022-${month}-01`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  try {
    const categories = await Product.aggregate([
      { $match: { dateOfSale: { $gte: start, $lt: end } } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    res.status(200).json(categories);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Combine all statistics
exports.getCombinedData = async (req, res) => {
  const month = req.params.month;

  try {
    const statistics = await exports.statisticsByMonth(req, res);
    const barChart = await exports.getBarChartData(req, res);
    const pieChart = await exports.getPieChartData(req, res);

    res.status(200).json({
      statistics: statistics,
      barChart: barChart,
      pieChart: pieChart,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
