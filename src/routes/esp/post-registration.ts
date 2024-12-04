import { Request, Response } from "express";
import { UserModel } from "../../models/user.js";
import { ESPModel } from "../../models/esp.js";

export default function (req: Request, res: Response) {
	const { id_user, id_esp } = req.body;
	
	if (!id_user || !id_esp) {
		res.status(400).json({
			message: "id_user dan id_esp harus diisi"
		});
		return;
	}
	
	// Cek apakah user dengan id_user tersebut ada
	const user = req.sqlite3.prepare<unknown[], UserModel>("SELECT * FROM user WHERE id_user = ?").get(id_user);

	if (!user) {
		res.status(404).json({
			message: "User tidak ditemukan"
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
		res.status(400).json({
			message: "ESP sudah terdaftar pada user lain, silahkan gunakan ESP lain atau hubungi admin"
		});
		return;
	}

	// Jika ada, insert ke dalam database
	esp.id_user = id_user;

	const insert = req.sqlite3.prepare("UPDATE esp SET id_user = ? WHERE id_esp = ?").run(id_user, id_esp);

	if (insert.changes === 0) {
		res.status(500).json({
			message: "Gagal menambahkan ESP ke user"
		});
		return;
	}


	res.status(201).json({
		message: "ESP berhasil ditambahkan ke user"
	});
}