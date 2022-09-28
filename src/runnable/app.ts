import { Database, MongoClient } from "../deps.ts";
import { AppRunner } from "../runner.ts";

interface PlanningConnection {
  v1: Database;
  v2: Database;
}

class App extends AppRunner {
  planningConnection?: PlanningConnection;

  private async connectDatabase() {
    const mongoClient = new MongoClient();

    this.planningConnection = {
      v1: await mongoClient.connect({
        db: "planning",
        tls: true,
        servers: this.env.MONGO_DB_HOSTS.split(",").map((host) => ({
          host: host,
          port: parseInt(this.env.MONGO_DB_PORT),
        })),
        credential: {
          username: this.env.MONGO_DB_USERNAME,
          password: this.env.MONGO_DB_PASSWORD,
          db: "planning",
          mechanism: "SCRAM-SHA-1",
        },
      }),
      v2: mongoClient.database("planning-v2"),
    };
  }

  async init() {
    await this.connectDatabase();
  }
}

export default App;
