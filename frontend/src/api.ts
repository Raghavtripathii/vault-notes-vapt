import axios from "axios";

// every request we make from the frontend goes to our backend,
const api = axios.create({
  baseURL: "http://localhost:3000",
});

export default api;