import sequelize from "../src/database/connection/connection";
import fs from 'fs';
import path from 'path';

async function listTables() {
  try {
    await sequelize.authenticate();
    console.log("Connected.");
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log("Tables in DB:", tables);
    fs.writeFileSync(path.join(process.cwd(), 'tables.txt'), JSON.stringify(tables, null, 2));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit();
  }
}

listTables();
