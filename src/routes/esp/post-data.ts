import { Request, Response } from "express";
import { ESPModel } from "../../models/esp.js";
import { BaseDeviceModel } from "../../models/devices/base_device.js";
import { validateAdditionalProps as validatePZEM } from "../../models/devices/pzem.js";
import { validateAdditionalProps as validateDHT } from "../../models/devices/dht.js";
import { validateAdditionalProps as validateRelay } from "../../models/devices/relay.js";

export default function(req: Request, res: Response) {
	const { id_esp, devices } = req.body;
	
	if (!id_esp) {
		res.status(400).json({
			message: "id_esp harus diisi"
		});
		return;
	}

	if (!devices) {
		res.status(400).json({
			message: "Data perangkat (devices) harus diisi"
		});
		return;
	}
	
	// Cek apakah esp dengan id_esp tersebut ada
	let esp = req.sqlite3.prepare<unknown[], ESPModel>("SELECT * FROM esp WHERE id_esp = ?").get(id_esp);

	if (!esp) {
		// Buat data esp baru
		const insertNewEsp = req.sqlite3.prepare("INSERT INTO esp (id_esp) VALUES (?)").run(id_esp);

		if (insertNewEsp.changes === 0) {
			res.status(500).json({
				message: "Gagal membuat data ESP baru"
			});
			return;
		}

		esp = req.sqlite3.prepare<unknown[], ESPModel>("SELECT * FROM esp WHERE id_esp = ?").get(id_esp);

		// TYPESCRIPT-INFERRED: esp tidak akan pernah null di sini
		if (!esp) { return; }
	}

	const devices_database = req.sqlite3.prepare<unknown[], BaseDeviceModel>("SELECT * FROM devices WHERE id_esp = ?").all(id_esp);

	// Untuk setiap data perangkat pada request body
	let device_iteration = 0;
	let device_created = 0;
	let device_updated = 0;

	for (const deviceBody of devices) {
		device_iteration++;

		//#region Validasi data perangkat dasar (BaseDeviceModel)
		if (!deviceBody.id) {
			res.status(400).json({
				message: `id perangkat ke-${device_iteration} harus diisi`
			});
			return;
		}

		if (!deviceBody.id_esp) {
			res.status(400).json({
				message: `id_esp perangkat ke-${device_iteration} harus diisi`
			});
			return;
		}

		if (!deviceBody.device_type) {
			res.status(400).json({
				message: `device_type perangkat ke-${device_iteration} harus diisi`
			});
			return;
		}
		deviceBody.device_type = deviceBody.device_type.toLowerCase();
		//#endregion

		let validatedDeviceBody: BaseDeviceModel = {
			id: deviceBody.id,
			id_esp: deviceBody.id_esp,
			device_type: deviceBody.device_type,
			device_data: {},
			created_at: 0,
			updated_at: 0
		}

		// TYPESCRIPT-INFERRED: deviceBody.device_data tidak akan pernah berupa string di sini
		if (typeof validatedDeviceBody.device_data === "string") { return; }

		const baseProps = Object.keys(validatedDeviceBody);

		// Ambil semua properti tambahan yang tidak ada di BaseDeviceModel
		const additionalProps = Object.keys(deviceBody).filter(key => !baseProps.includes(key));

		// Gabungkan semua properti tambahan ke dalam device_data
		for (const prop of additionalProps) {
			validatedDeviceBody.device_data[prop] = deviceBody[prop];
		}

		// Validasi additionalProps menurut device_type yang sesuai
		switch (validatedDeviceBody.device_type) {
			case "pzem":
				const validatePZEMResult = validatePZEM(validatedDeviceBody.device_data);

				if (validatePZEMResult) {
					res.status(400).json({
						message: `Data perangkat ke-${device_iteration} tidak valid: ${validatePZEMResult}`
					});
					return;
				}
				break;

			case "dht":
				const validateDHTResult = validateDHT(validatedDeviceBody.device_data);

				if (validateDHTResult) {
					res.status(400).json({
						message: `Data perangkat ke-${device_iteration} tidak valid: ${validateDHTResult}`
					});
					return;
				}
				break;

			case "relay":
				const validateRelayResult = validateRelay(validatedDeviceBody.device_data);

				if (validateRelayResult) {
					res.status(400).json({
						message: `Data perangkat ke-${device_iteration} tidak valid: ${validateRelayResult}`
					});
					return;
				}
				break;

			// TODO: Tambahkan validasi untuk device_type lainnya di sini (jika ada)
		
			default:
				res.status(400).json({
					message: `device_type perangkat ke-${device_iteration} tidak dikenali`
				});
				break;
		}

		// Cek apakah perangkat tersebut sudah ada
		const device = devices_database.find(device => device.id === `${esp.id_esp}-${validatedDeviceBody.id}`);

		if (device) {
			// Update data perangkat
			const updateDevice = req.sqlite3.prepare("UPDATE devices SET device_data = ?, updated_at = ? WHERE id = ?");
			const updateDeviceResult = updateDevice.run(JSON.stringify(validatedDeviceBody.device_data), Date.now(), `${esp.id_esp}-${validatedDeviceBody.id}`);

			if (updateDeviceResult.changes === 0) {
				res.status(500).json({
					message: `Gagal mengupdate data perangkat ke-${device_iteration}`
				});
				return;
			}

			device_updated++;
		}
		else {
			// Masukkan data perangkat ke dalam database
			
			validatedDeviceBody.created_at = Date.now();
			validatedDeviceBody.updated_at = validatedDeviceBody.created_at;
			const insertDevice = req.sqlite3.prepare("INSERT INTO devices (id, id_esp, device_type, device_data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)");
			const insertDeviceResult = insertDevice.run(
				`${esp.id_esp}-${validatedDeviceBody.id}`,
				esp.id_esp,
				validatedDeviceBody.device_type,
				JSON.stringify(validatedDeviceBody.device_data),
				validatedDeviceBody.created_at,
				validatedDeviceBody.updated_at
			);

			if (insertDeviceResult.changes === 0) {
				res.status(500).json({
					message: `Gagal membuat data perangkat ke-${device_iteration}`
				});
				return;
			}

			device_created++;
		}
	}

	res.status(200).json({
		message: `Berhasil memproses ${device_iteration} data perangkat.`,
		device_created: device_created,
		device_updated: device_updated
	});
}