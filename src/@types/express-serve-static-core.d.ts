import express_core from "express-serve-static-core";
import { Database } from "better-sqlite3";
import { UserModel } from "../models/user.ts";

declare module "express-serve-static-core" {
	export interface Request extends express_core.Request {
		sqlite3: Database;
		VoltnesiaUser?: UserModel;
	}
}