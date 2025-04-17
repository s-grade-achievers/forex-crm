const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";
const DUMMY_API_URL =
	process.env.REACT_APP_DUMMY_API_URL || "http://localhost:3001";
const MASTER_URL = process.env.REACT_APP_MASTER_URL || "http://localhost:5000";

export { BASE_URL, DUMMY_API_URL, MASTER_URL };