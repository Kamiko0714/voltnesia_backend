import { BaseDeviceModel } from "./base_device.js";

export type DHT_DeviceModel = BaseDeviceModel & {
	temp: number;
};

export function validateAdditionalProps(device: any): string {
	if (device.temp === undefined) {
		return "Data DHT harus memiliki properti temp";
	}

	if (typeof device.temp !== "number") {
		return "Properti temp harus berupa angka desimal";
	}

	return "";
}