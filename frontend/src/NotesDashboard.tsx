import { useState, useEffect } from "react";
import api from "./api";

interface Note {
  id: number;
  user_id: number;
  title: string;
  content: string;
}

interface NotesDashboardProps {
  token: string;
}

function NotesDashboard({ token }: NotesDashboardProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");

  async function fetchNotes() {
    try {
      const response = await api.get("/notes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotes(response.data);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "Could not load notes";
      setMessage(errorMsg);
    }
  }

  // runs once, right after this component first appears on screen
  useEffect(() => {
    fetchNotes();
  }, []);

  async function handleCreateNote(e: React.FormEvent) {
    e.preventDefault();

    try {
      await api.post(
        "/notes",
        { title, content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTitle("");
      setContent("");
      setMessage("Note created!");
      fetchNotes(); // refresh the list so the new note shows up immediately
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "Could not create note";
      setMessage(errorMsg);
    }
  }

  return (
    <div>
      <h2>My Notes</h2>

      <form onSubmit={handleCreateNote}>
        <div>
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label>Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <button type="submit">Add Note</button>
      </form>

      {message && <p>{message}</p>}

      <ul>
        {notes.map((note) => (
          <li key={note.id}>
            <strong>{note.title}</strong>
            <p>{note.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default NotesDashboard;