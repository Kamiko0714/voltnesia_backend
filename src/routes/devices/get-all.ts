import { Request, Response } from 'express';
import { ESPModel } from '../../models/esp.js';
import { BaseDeviceModel } from '../../models/devices/base_device.js';

export default function(req: Request, res: Response) {
	const esp_id = req.query.esp_id;

	if (!esp_id) {
		res.status(400).json({
			message: "Parameter esp_id harus diisi"
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
	const devices = req.sqlite3.prepare<unknown[], BaseDeviceModel>("SELECT * FROM devices WHERE id_esp = ?").all(esp_id);
	const mappedDevices = devices.map(device => {
		const additionalProps = (typeof device.device_data === "string") ? JSON.parse(device.device_data) : device.device_data;

		return {
			id: device.id,
			id_esp: device.id_esp,
			device_type: device.device_type,
			created_at: device.created_at,
			updated_at: device.updated_at,
			...additionalProps
		};
	})
	
	res.status(200).json({
        esp,
		devices: mappedDevices
    });
}