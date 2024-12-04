import { Request, Response, NextFunction } from "express";
import { UserModel } from "../models/user.js";
import { SessionModel } from "../models/session.js";

export default function(req: Request, res: Response, next: NextFunction) {
	// Cek apakah ada bearer token
	const bearerToken = req.headers.authorization;

	if (!bearerToken) {
		res.status(401).json({
			message: "Tidak ada token pada header Authorization"
		});
		return;
	}

	// Cek apakah token terdiri dari 2 part setelah di split (Bearer dan token)
	const tokenParts = bearerToken.split(" ");
	if (tokenParts.length !== 2) {
		res.status(401).json({
			message: "Token tidak valid"
		});
		return;
	}
	const token = tokenParts[1];

	// Cek apakah token valid
	const session = req.sqlite3.prepare<unknown[], SessionModel>("SELECT * FROM session WHERE id = ?").get(token);

	if (!session) {
		res.status(401).json({
			message: "Token tidak valid atau sudah expired"
		});
		return;
	}


	let session_expired_at: Date | undefined;
	let LAMA_WAKTU_SESSION_MENIT = parseInt(process.env.LAMA_WAKTU_SESSION_MENIT || "0");

	if (LAMA_WAKTU_SESSION_MENIT > 0) {
		session_expired_at = new Date(session.created_at);
		session_expired_at.setMinutes(session_expired_at.getMinutes() + LAMA_WAKTU_SESSION_MENIT);
	}

	// Cek apakah token sudah expired
	if (session_expired_at && session_expired_at < new Date()) {
		res.status(401).json({
			message: "Token sudah expired"
		});

		// Hapus session yang sudah expired
		req.sqlite3.prepare("DELETE FROM session WHERE id = ?").run(session.id);
		return;
	}

	// Cek apakah user yang login masih ada
	const user = req.sqlite3.prepare<unknown[], UserModel>("SELECT * FROM user WHERE id_user = ?").get(session.id_user);

	if (!user) {
		res.status(401).json({
			message: "User dengan session ini tidak ditemukan"
		});
		return;
	}

	req.VoltnesiaUser = user;
	next();
}