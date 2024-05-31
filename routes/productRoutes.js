const express=require('express');
const router=express.Router();
const productController=require('../controllers/productController');

router.get('/initialize', productController.initializeDatabase);

router.get('/transactions', productController.listTransactions);

router.get('/statistics/:month', productController.statisticsByMonth);

// Get bar chart data for a specific month
router.get('/bar-chart/:month', productController.getBarChartData);

// Get pie chart data for a specific month
router.get('/pie-chart/:month', productController.getPieChartData);

// Combine all statistics
router.get('/combined/:month', productController.getCombinedData);

module.exports=router;