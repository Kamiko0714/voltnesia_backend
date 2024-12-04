export function createModelSQL() {
	return `CREATE TABLE IF NOT EXISTS devices (
		id STRING PRIMARY KEY NOT NULL,
		id_esp STRING NOT NULL,
		device_type STRING NOT NULL,
		device_data STRING NOT NULL,

		created_at TIMESTAMP NOT NULL,
		updated_at TIMESTAMP NOT NULL,
		
		FOREIGN KEY(id_esp) REFERENCES esp(id_esp) ON DELETE CASCADE
	);`.replace(/\n/g, " ").replace(/\t/g, "");
}