import { BaseDeviceModel } from "./base_device.js";

export type PZEM_DeviceModel = BaseDeviceModel & {
	status: boolean;
};

export function validateAdditionalProps(device: any): string {
	if (device.status === undefined) {
		return "Data Relay harus memiliki properti status";
	}

	if (typeof device.status !== "boolean") {
		return "Properti status harus berupa boolean";
	}

	return "";
}