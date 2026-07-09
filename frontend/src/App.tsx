import { useState } from "react";
import Signup from "./Signup";
import Login from "./Login";

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

      {token && (
        <div>
          <p>You are logged in!</p>
        </div>
      )}
    </div>
  );
}

export default App;