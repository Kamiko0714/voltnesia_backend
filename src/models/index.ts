import { Database } from "better-sqlite3";
import { createModelSQL as createUserModel } from "./user.js";
import { createModelSQL as createSessionModel } from "./session.js";
import { createModelSQL as createDevicesBaseModel } from "./devices/index.js";
import { createModelSQL as createEspModel } from "./esp.js";

export function createModelSQL(database: Database) {
	database.exec(createUserModel());
	database.exec(createSessionModel());
	database.exec(createDevicesBaseModel());
	database.exec(createEspModel());
}