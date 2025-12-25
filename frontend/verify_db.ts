import { db } from "./lib/db";
import { sql } from "drizzle-orm";

async function checkTables() {
    try {
        const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log("Tables in database:", tables);

        const columns = await db.execute(sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'image_analyses'
    `);
        console.log("Columns in image_analyses:", columns);
    } catch (e) {
        console.error("Verification failed:", e);
    }
    process.exit(0);
}

checkTables();
