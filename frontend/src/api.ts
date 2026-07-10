import axios from "axios";

// every request we make from the frontend goes to our backend,
const JWT_SECRET_LEAKED_BY_MISTAKE = "this_is_a_super_secret_key_change_it_later";

const api = axios.create({
  baseURL: "http://localhost:3000",
});

export default api;