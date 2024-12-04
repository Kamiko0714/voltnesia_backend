import { Request, Response } from "express";
import { ESPModel } from "../../models/esp.js";

export default function(req: Request, res: Response) {
	const { id_esp } = req.query;
	
	if (!id_esp) {
		res.status(400).json({
			message: "id_esp harus diisi"
		});
		return;
	}
	
	// Cek apakah esp dengan id_esp tersebut ada
	const esp = req.sqlite3.prepare<unknown[], ESPModel>("SELECT * FROM esp WHERE id_esp = ?").get(id_esp);

	if (!esp) {
		res.status(404).json({
			message: "ESP tidak ditemukan"
		});
		return;
	}

	// Cek apakah sudah ada user pada esp tersebut
	if (esp.id_user) {
		res.status(200).json({
			message: "ESP sudah terdaftar pada user lain, silahkan gunakan ESP lain atau hubungi admin"
		});
		return;
	}

	res.status(200).json({
		message: "ESP belum terdaftar pada user manapun"
	});
}