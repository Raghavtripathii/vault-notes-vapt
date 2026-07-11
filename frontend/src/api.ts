import axios from "axios";

// every request we make from the frontend goes to our backend,
const JWT_SECRET_LEAKED_BY_MISTAKE = "this_is_a_super_secret_key_change_it_later";

(window as any).__leakedJwtSecret = JWT_SECRET_LEAKED_BY_MISTAKE;

const api = axios.create({
  baseURL: "https://vault-notes-backend.onrender.com",
});

export default api;