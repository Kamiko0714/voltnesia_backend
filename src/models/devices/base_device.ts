export type BaseDeviceModel = {
	id: string;
	id_esp: string; // Foreign Key ke ESPModel.id
	device_type: "dht" | "relay" | "pzem";

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