import { BaseDeviceModel } from "./devices/base_device.js";

export type ESPModel = {
	id_esp: string;
	id_user?: string; // Foreign Key ke UserModel.id

	// NOTE: Tidak disimpan di database esp langsung
	devices: { [key: string]: BaseDeviceModel }; // Berisi devices.id, tidak disimpan di database esp langsung
}

export function createModelSQL() {
	return `CREATE TABLE IF NOT EXISTS esp (
		id_esp STRING PRIMARY KEY NOT NULL,
		id_user STRING,
		
		FOREIGN KEY(id_user) REFERENCES user(id_user)
	);`.replace(/\n/g, " ").replace(/\t/g, "");
}