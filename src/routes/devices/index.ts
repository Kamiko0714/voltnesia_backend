import deleteByid from "./delete-byid.js";
import getAll from "./get-all.js";
import getByid from "./get-byid.js";
import updateData from "./update-data.js";
import getRelayByid from "./relay/get-byid.js";

export default {
	getAll: getAll,
	getByid: getByid,
	deleteByid: deleteByid,
	updateData: updateData,
	getRelayByid: getRelayByid
}