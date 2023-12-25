import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const migrationClient = drizzle(
  postgres(`${process.env.MIGRATIONS_DATABASE_URL}`, { ssl: "require", max: 1 })
);

const main = async () => {
  try {
    await migrate(migrationClient, { migrationsFolder: "drizzle" });
    console.log("Migration complete");
  } catch (error) {
    console.log(error);
  }
  process.exit(0);
};
main();
