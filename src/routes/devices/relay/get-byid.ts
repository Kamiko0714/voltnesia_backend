import { Request, Response } from 'express';
import { ESPModel } from '../../../models/esp.js';
import { BaseDeviceModel, ParseDeviceData } from '../../../models/devices/base_device.js';
import { Relay_DeviceModel } from '../../../models/devices/relay.js';

export default function(req: Request, res: Response) {
	const { esp_id, device_id } = req.query;

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

	// Ambil data esp
	const esp = req.sqlite3.prepare<unknown[], ESPModel>("SELECT * FROM esp WHERE id_esp = ?").get(esp_id);

	if (!esp) {
		res.status(404).json({
			message: "ESP tidak ditemukan"
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

	if (device.device_type !== "relay") {
		res.status(400).json({
			message: "Perangkat dengan id tersebut bukan relay"
		});
		return;
	}

	const deviceParsed = ParseDeviceData<Relay_DeviceModel>(device);

	if (!deviceParsed) {
		res.status(500).json({
			message: "Data relay pada database tidak dapat dibaca, corrupt>"
		});
		return;
	}

	console.log(`Kondisi Relay 2 di database adalah ${deviceParsed.status}`);
	
	if (deviceParsed.status) {
		res.status(200).end("nyala");
		return;
	}
	res.status(200).end("mati");
}