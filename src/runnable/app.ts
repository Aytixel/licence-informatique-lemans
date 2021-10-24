import { DotenvConfig } from "https://deno.land/x/dotenv@v3.0.0/mod.ts";
import { MongoClient } from "https://deno.land/x/mongo@v0.28.0/mod.ts";
import { getJson } from "../utils.ts";

export default class {
  public env: DotenvConfig;
  public planningDB: any;
  public studentUsername: string;
  public studentPassword: string;
  public resourcesId: any;

  constructor(env: DotenvConfig) {
    this.env = env;
    this.planningDB = null;
    this.studentUsername = env.STUDENT_USERNAME;
    this.studentPassword = env.STUDENT_PASSWORD;
  }

  async connectDB(db: string) {
    const dbConnection: any = {
      client: new MongoClient(),
    };

    await dbConnection.client.connect({
      db: db,
      tls: true,
      servers: this.env.MONGO_DB_HOSTS.split(",").map((host: string) => ({
        host: host,
        port: this.env.MONGO_DB_PORT,
      })),
      credential: {
        username: this.env.MONGO_DB_USERNAME,
        password: this.env.MONGO_DB_PASSWORD,
        db: db,
        mechanism: "SCRAM-SHA-1",
      },
    });

    dbConnection.db = dbConnection.client.database(db);

    return dbConnection;
  }

  async init() {
    this.planningDB = await this.connectDB("planning");
    this.resourcesId = await getJson(
      this.env.RUNNABLE_PATH + "/planning-resources-id.json",
    );
  }
}
