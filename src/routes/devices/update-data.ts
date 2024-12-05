import { Request, Response } from 'express';
import { ESPModel } from '../../models/esp.js';
import { BaseDeviceModel, ExtractAdditionalProps, ParseDeviceData, ValidateAdditionalPropsByDeviceModelBool } from '../../models/devices/base_device.js';

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

	const ParsedDevice = ParseDeviceData<BaseDeviceModel>(device);

	if (!ParsedDevice) {
		res.status(500).json({
			message: "Data perangkat pada database tidak dapat dibaca, corrupt?"
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
		(ParsedDevice as any)[key] = device_newdata[key];
	}

	// Validasi additionalProps menurut device_type yang sesuai
	if (!ValidateAdditionalPropsByDeviceModelBool<BaseDeviceModel>(ParsedDevice)) {
		res.status(500).json({
			message: "Gagal mengupdate data perangkat, properti yang diupdate tidak lolos validasi (salah tipe/nilai?)"
		});
		return
	}

	const additionalProps = ExtractAdditionalProps(ParsedDevice);
	const additionalPropsJSON = JSON.stringify(additionalProps);

	// Update data perangkat
	const updateDevice = req.sqlite3.prepare("UPDATE devices SET device_data = ?, updated_at = ? WHERE id = ? AND id_esp = ?").run(additionalPropsJSON, Date.now(), internal_device_id, esp_id);
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