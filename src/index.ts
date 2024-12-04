import express from "express";
import dotenv from "dotenv";
import sqlite3 from "better-sqlite3";
import bodyParser from "body-parser";

// Load semua environment variable dari file .env
dotenv.config();

// Jika SQLITE_FILE_PATH tidak ada di .env
if (!process.env.SQLITE_FILE_PATH) {
	throw new Error("DB_PATH tidak ada di file .env");
}
const database = new sqlite3(process.env.SQLITE_FILE_PATH);
import { createModelSQL } from "./models/index.js";
createModelSQL(database);

const app = express();

// Sambungkan objek database ke Express agar bisa digunakan di mana saja
app.use((req, res, next) => {
	req.sqlite3 = database;
	next();
});

// Buat debugging json yang error
// app.use(bodyParser.text({ type: "*/*" }));

// Auto parse JSON body dari request
app.use(express.json());

app.use((req, res, next) => {
	console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);
	next();
});

app.get("/", (req, res) => {
	res.status(200).json({
		message: "Voltnesia Backend API is running"
	});
});

import EspRoute from "./routes/esp/index.js";
app.post("/esp/data", EspRoute.postData);

import AuthRoute from "./routes/auth/index.js";

app.post("/auth/register", AuthRoute.register);
app.post("/auth/login", AuthRoute.login);

import AuthMiddleware from "./middlewares/auth.js";
app.use(AuthMiddleware);

app.get("/esp/registration", EspRoute.getRegistration);
app.post("/esp/registration", EspRoute.postRegisteration);

import DeviceRoute from "./routes/devices/index.js";
app.get("/devices", DeviceRoute.getAll);
app.get("/device", DeviceRoute.getByid);
app.get("/device/relay", DeviceRoute.getRelayByid);
app.delete("/device", DeviceRoute.deleteByid);
app.post("/delete-device", DeviceRoute.deleteByid);
app.post("/update-device", DeviceRoute.updateData);

app.listen(process.env.PORT || 3000, () => {
	console.log("Server is running on port " + (process.env.PORT || 3000));
});

// Handle server exit
process.on("exit", () => {
	database.close();
});
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));