import { Request, Response } from 'express';
import { ESPModel } from '../../models/esp.js';
import { BaseDeviceModel } from '../../models/devices/base_device.js';
import { validateAdditionalProps as validatePZEM } from "../../models/devices/pzem.js";
import { validateAdditionalProps as validateDHT } from "../../models/devices/dht.js";
import { validateAdditionalProps as validateRelay } from "../../models/devices/relay.js";

export default function(req: Request, res: Response) {
	const { esp_id, device_id, device_newdata } = req.body;

	if (!esp_id) {
		res.status(400).json({
			message: "Parameter esp_id harus diisi"
		});
		return;
	}

	if (!device_id) {
		res.status(400).json({
			message: "Parameter device_id harus diisi"
		});
		return;
	}

	if (!device_newdata) {
		res.status(400).json({
			message: "Parameter device_newdata harus diisi"
		});
		return;
	}

	// Pastikan device_newdata adalah object
	if (typeof device_newdata !== "object") {
		res.status(400).json({
			message: "Parameter device_newdata harus berupa object json"
		});
		return;
	}

	// Ambil data esp
	const esp = req.sqlite3.prepare<unknown[], ESPModel>("SELECT * FROM esp WHERE id_esp = ?").get(esp_id);

	if (!esp) {
		res.status(404).json({
			message: "ESP tidak ditemukan"
		});
		return;
	}

	// TYPESCRIPT-INFERRED: req.VoltnesiaUser tidak akan pernah null di sini
	if (!req.VoltnesiaUser) { return; }

	// Pastikan esp ini dimiliki oleh user yang sedang login
	if (esp.id_user !== req.VoltnesiaUser.id_user) {
		res.status(403).json({
			message: "Perangkat ESP ini bukan milik Anda"
		});
		return;
	}

	// Ambil data perangkat
	const internal_device_id = `${esp_id}-${device_id}`;
	const device = req.sqlite3.prepare<unknown[], BaseDeviceModel>("SELECT * FROM devices WHERE id = ? AND id_esp = ?").get(internal_device_id, esp_id);

	if (!device) {
		res.status(404).json({
			message: "Perangkat dengan id tersebut tidak ditemukan pada ESP ini"
		});
		return;
	}

	// Pastikan prop yang diubah bukan properti yang wajib
	const device_newdataKeys = Object.keys(device_newdata);

	for (const key of device_newdataKeys) {
		if (["id", "id_esp", "device_type", "device_data", "created_at", "updated_at"].includes(key)) {
			res.status(400).json({
				message: `Properti ${key} tidak boleh diubah`
			});
			return;
		}

		// Ubah properti tambahan
		(device as any)[key] = device_newdata[key];
	}

	// Update properti tambahan
	for (const key of device_newdataKeys) {
		(device as any)[key] = device_newdata[key];
	}

	// Validasi additionalProps menurut device_type yang sesuai
	switch (device.device_type) {
		case "pzem":
			const validatePZEMResult = validatePZEM(device);

			if (validatePZEMResult) {
				res.status(400).json({
					message: `Data perangkat tidak valid: ${validatePZEMResult}`
				});
				return;
			}
			break;

		case "dht":
			const validateDHTResult = validateDHT(device);

			if (validateDHTResult) {
				res.status(400).json({
					message: `Data perangkat tidak valid: ${validateDHTResult}`
				});
				return;
			}
			break;

		case "relay":
			const validateRelayResult = validateRelay(device);

			if (validateRelayResult) {
				res.status(400).json({
					message: `Data perangkat tidak valid: ${validateRelayResult}`
				});
				return;
			}
			break;

		// TODO: Tambahkan validasi untuk device_type lainnya di sini (jika ada)
	
		default:
			res.status(400).json({
				message: `device_type perangkat tidak dikenali`
			});
			break;
	}

	// Update data perangkat
	const updateDevice = req.sqlite3.prepare("UPDATE devices SET device_data = ?, updated_at = ? WHERE id = ? AND id_esp = ?").run(JSON.stringify(device.device_data), Date.now(), internal_device_id, esp_id);
	if (updateDevice.changes === 0) {
		res.status(500).json({
			message: "Gagal mengupdate data perangkat"
		});
		return
	}
		
	res.status(200).json({
		message: "Data perangkat berhasil diubah"
    });
}