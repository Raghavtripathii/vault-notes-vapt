import { useState } from "react";

const SITE_PASSWORD = "vaultnotes2026";

interface PasswordGateProps {
  children: React.ReactNode;
}

function PasswordGate({ children }: PasswordGateProps) {
  const [input, setInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (input === SITE_PASSWORD) {
      setUnlocked(true);
      setError("");
    } else {
      setError("Incorrect passcode.");
    }
  }

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <div style={{ textAlign: "center", marginTop: "4rem" }}>
      <h1>Vault Notes</h1>
      <p>This is a deliberately vulnerable demo application.</p>
      <p>Enter the passcode to continue.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Passcode"
        />
        <button type="submit">Enter</button>
      </form>
      {error && <p style={{ color: "salmon" }}>{error}</p>}
    </div>
  );
}

export default PasswordGate;