import { BaseDeviceModel } from "./base_device.js";

export type PZEM_DeviceModel = BaseDeviceModel & {
	current: number;
	frekuensi: number;
	power: number;
	voltase: number;
	energy: number;
};

export function validateAdditionalProps(device: any): string {
	if (device.current === undefined) {
		return "Data PZEM harus memiliki properti current";
	}

	if (typeof device.current !== "number") {
		return "Properti current harus berupa angka desimal";
	}

	if (device.frekuensi === undefined) {
		return "Data PZEM harus memiliki properti frekuensi";
	}

	if (typeof device.frekuensi !== "number") {
		return "Properti frekuensi harus berupa angka desimal";
	}

	if (device.power === undefined) {
		return "Data PZEM harus memiliki properti power";
	}

	if (typeof device.power !== "number") {
		return "Properti power harus berupa angka desimal";
	}

	if (device.voltase === undefined) {
		return "Data PZEM harus memiliki properti voltase";
	}

	if (typeof device.voltase !== "number") {
		return "Properti voltase harus berupa angka desimal";
	}

	if (device.energy === undefined) {
		return "Data PZEM harus memiliki properti energy";
	}

	if (typeof device.energy !== "number") {
		return "Properti energy harus berupa angka desimal";
	}

	return "";
}