import { useState } from "react";
import Signup from "./Signup";
import Login from "./Login";
import NotesDashboard from "./NotesDashboard";

function App() {
  const [token, setToken] = useState("");

  function handleLoginSuccess(newToken: string) {
    setToken(newToken);
  }

  return (
    <div>
      <h1>Vault Notes</h1>

      {!token && (
        <>
          <Signup />
          <Login onLoginSuccess={handleLoginSuccess} />
        </>
      )}

      {token && <NotesDashboard token={token} />}
    </div>
  );
}

export default App;