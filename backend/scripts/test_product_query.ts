import sequelize from "../src/database/connection/connection";
import Product from "../src/database/models/productModel";

async function testQuery() {
  try {
    await sequelize.authenticate();
    console.log("Connected.");
    
    // Raw query to be sure
    const [results] = await sequelize.query('SELECT * FROM "products" LIMIT 1;');
    console.log("Raw query result:", results);

    // Model query
    const count = await Product.count();
    console.log("Product count:", count);
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit();
  }
}

testQuery();
