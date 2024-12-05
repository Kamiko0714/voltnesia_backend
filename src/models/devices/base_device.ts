import { validateAdditionalProps as validateRelay } from "../../models/devices/relay.js";
import { validateAdditionalProps as validatePZEM } from "../../models/devices/pzem.js";
import { validateAdditionalProps as validateDHT } from "../../models/devices/dht.js";

export type DeviceTypes = "dht" | "relay" | "pzem" | "unknown";

export type BaseDeviceModel = {
	id: string;
	id_esp: string; // Foreign Key ke ESPModel.id
	device_type: DeviceTypes;

	/** Data spesifik device yang disimpan dalam bentuk JSON
	 * 
	 * **Harusnya tidak digunakan, parse JSON string ini lalu gabung ke object yang sama**
	 * ```js
	 * let device_db = ... <- dari database
	 * const device = {
	 * 	...device_db,
	 * 	JSON.parse(device.device_data)
	 * }
	 * ```
	*/
	device_data: string | { [key: string]: string | number | boolean | null | undefined };

	created_at: number;
	updated_at: number;
}

/** Ambil semua properti yang ada di BaseDeviceModel saja */
export function ExtractRequiredBaseProps<AllowPartial extends boolean>(device_object: any, partial: AllowPartial): AllowPartial extends true ? Partial<BaseDeviceModel> : (BaseDeviceModel | undefined) {
	const required_props = ["id", "id_esp", "device_type"];
	let new_object: { [key: string]: any } = {};

	if (partial) {
		new_object = {
			id: device_object.id || "",
			id_esp: device_object.id_esp || "",
			device_type: device_object.device_type || "unknown",
			device_data: device_object.device_data || "{}",
			created_at: device_object.created_at || 0,
			updated_at: device_object.updated_at || 0,
		}

		new_object.device_type = new_object.device_type.toLowerCase();

		return new_object as any
	}

	for (const index in required_props) {
		if (!Object.prototype.hasOwnProperty.call(required_props, index)) {
			continue;
		}

		const key = required_props[index];

		if (!device_object[key]) {
			return undefined as any;
		}

		new_object[key] = device_object[key];
	}

	return new_object as BaseDeviceModel
	
}

export function ExtractAdditionalProps<T extends BaseDeviceModel>(device_object: T): Omit<T, keyof BaseDeviceModel> {
	const required_props = ["id", "id_esp", "device_type", "device_data", "created_at", "updated_at"];
	const keys = Object.keys(device_object);

	const additionalPropKeys = Object.keys(device_object).filter(key => !required_props.includes(key));

	const new_object: { [key: string]: any } = {};

	additionalPropKeys.forEach(key => {
		new_object[key] = device_object[(key as keyof T)];
	});
	
	return new_object as Omit<T, keyof BaseDeviceModel>;
}

export function ParseDeviceData<T extends BaseDeviceModel>(device_object: any): T | undefined {
	if (!device_object.id) {
		return;
	}

	if (!device_object.id_esp) {
		return;
	}

	if (!device_object.device_type) {
		return;
	}
	device_object.device_type = device_object.device_type.toLowerCase();

	if (!device_object.device_data) {
		return;
	}

	let validatedDeviceBody: BaseDeviceModel = {
		id: device_object.id as string,
		id_esp: device_object.id_esp as string,
		device_type: device_object.device_type as DeviceTypes,
		device_data: "",
		created_at: 0,
		updated_at: 0
	}

	try {
		if (typeof device_object.device_data === "string") {
			const device_data_parsed = JSON.parse(device_object.device_data);
			validatedDeviceBody = {
				...validatedDeviceBody,
				...device_data_parsed
			}
			validatedDeviceBody.device_data = device_data_parsed;
		}
	}
	catch(error) {
		return;
	}

	// TYPESCRIPT-INFERRED: deviceBody.device_data tidak akan pernah berupa string di sini
	if (typeof validatedDeviceBody.device_data === "string") { return; }

	// Ambil semua properti tambahan yang tidak ada di BaseDeviceModel
	const additionalProps = ExtractAdditionalProps<T>(validatedDeviceBody as any);

	// Validasi additionalProps menurut device_type yang sesuai
	switch (validatedDeviceBody.device_type) {
		case "pzem":
			const validatePZEMResult = validatePZEM(additionalProps);

			if (validatePZEMResult) {
				
				return;
			}
			break;

		case "dht":
			const validateDHTResult = validateDHT(additionalProps);

			if (validateDHTResult) {
				return;
			}
			break;

		case "relay":
			const validateRelayResult = validateRelay(additionalProps);

			if (validateRelayResult) {
				return;
			}

			console.log(`ESP melaporkan status ${validatedDeviceBody.id} adalah ${(validatedDeviceBody as any).device_data.status}`);
			break;

		// TODO: Tambahkan validasi untuk device_type lainnya di sini (jika ada)
	
		default:
			return;
	}

	// Gabungkan semua properti tambahan ke dalam device_data
	return {
		...validatedDeviceBody,
		...additionalProps
	} as any
}

export function ValidateAdditionalProps(device_type: DeviceTypes, device_object: any): string {
	switch (device_type) {
		case "pzem":
			return validatePZEM(device_object);

		case "dht":
			return validateDHT(device_object);

		case "relay":
			return validateRelay(device_object);

		// TODO: Tambahkan validasi untuk device_type lainnya di sini (jika ada)
	}

	return "Jenis perangkat tidak dikenal";
}

export function ValidateAdditionalPropsByDeviceModel<T extends BaseDeviceModel>(device_object: T): string {
	return ValidateAdditionalProps(device_object.device_type, device_object);
}

export function ValidateAdditionalPropsByDeviceModelBool<T extends BaseDeviceModel>(device_object: T): boolean {
	if (ValidateAdditionalPropsByDeviceModel(device_object) === "") {
		return true;
	}
	return false;
}