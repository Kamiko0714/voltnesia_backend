import { Request, Response } from "express";
import { UserModel } from "../../models/user.js";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 24);

const register = (req: Request, res: Response) => {
	// Jika sudah ada session, tidak bisa register
	if (req.VoltnesiaUser) {
		res.status(400).json({
			message: "Anda sudah login"
		});
		return
	}

	// Ambil data dari body
	const { username, password, email } = req.body;

	// Validasi data, pastikan tidak ada yang kosong
	if (!username || !password || !email) {
		res.status(400).json({
			message: "Data tidak lengkap"
		});
		return
	}

	// Cek apakah username sudah dipakai
	const user = req.sqlite3.prepare<unknown[], UserModel>("SELECT * FROM user WHERE nama = ? OR gmail = ?").get(username, email);

	if (user) {
		res.status(400).json({
			message: "Username atau email sudah dipakai"
		});
		return
	}

	// Insert data ke database
	const insert = req.sqlite3.prepare("INSERT INTO user (id_user, nama, pass, gmail) VALUES (?, ?, ?, ?)")
		.run(nanoid(), username, password, email);

	if (insert.changes === 0) {
		res.status(500).json({
			message: "Gagal membuat user"
		});
		return
	}

	res.status(201).json({
		message: "User berhasil dibuat"
	});
};

const login = (req: Request, res: Response) => {
	// Jika sudah ada session, tidak bisa login
	if (req.VoltnesiaUser) {
		res.status(400).json({
			message: "Anda sudah login"
		});
		return;
	}

	// Ambil data dari body
	const { email, password } = req.body;

	// Validasi data, pastikan tidak ada yang kosong
	if (!email || !password) {
		res.status(400).json({
			message: "Data tidak lengkap"
		});
		return;
	}

	// Cek apakah user ada
	const user = req.sqlite3.prepare<unknown[], UserModel>("SELECT * FROM user WHERE gmail = ?").get(email);

	if (!user) {
		res.status(400).json({
			message: "User tidak ditemukan atau password salah"
		});
		return;
	}

	// Cek apakah password benar
	if (user.pass.toString() !== password) {
		res.status(400).json({
			message: "User tidak ditemukan atau password salah"
		});
		return;
	}

	const token = nanoid(64);
	const created_at = new Date().getTime();

	// Insert data ke database
	const insert = req.sqlite3.prepare("INSERT INTO session (id, id_user, created_at) VALUES (?, ?, ?)").run(token, user.id_user, created_at);

	if (insert.changes === 0) {
		res.status(500).json({
			message: "Gagal membuat session"
		});
		return;
	}

	res.status(200).json({
		message: "Berhasil login",
		token: token,
		id_user: user.id_user
	});
};

export default {
	register,
	login
};