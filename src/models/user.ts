export type UserModel = {
	id_user: string;
	nama: string;
	pass: string;
	gmail: string;
}

export function createModelSQL() {
	return `CREATE TABLE IF NOT EXISTS user (
		id_user STRING PRIMARY KEY NOT NULL,
		nama STRING NOT NULL,
		pass STRING NOT NULL,
		gmail STRING NOT NULL
	);`.replace(/\n/g, " ").replace(/\t/g, "");
}