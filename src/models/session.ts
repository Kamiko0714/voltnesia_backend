export type SessionModel = {
	id: string;
	id_user: string; // Foreign Key ke UserModel.id

	/** Waktu token dibuat dalam UNIX Timestamp */
	created_at: number;
}

export function createModelSQL() {
	return `CREATE TABLE IF NOT EXISTS session (
		id STRING PRIMARY KEY NOT NULL,
		id_user STRING NOT NULL,
		created_at TIMESTAMP NOT NULL,
		
		FOREIGN KEY(id_user) REFERENCES user(id_user)
	);`.replace(/\n/g, " ").replace(/\t/g, "");
}