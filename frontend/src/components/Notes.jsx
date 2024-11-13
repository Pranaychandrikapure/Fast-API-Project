import React, { useState, useEffect } from "react";

const NotesPage = () => {
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editNoteTitle, setEditNoteTitle] = useState("");
  const [editNoteContent, setEditNoteContent] = useState("");
  const [currentNoteId, setCurrentNoteId] = useState(null);

  // Fetch notes on component mount
  useEffect(() => {
    const fetchNotes = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch("http://127.0.0.1:8000/notes", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to fetch notes");

        const data = await response.json();
        setNotes(data);
      } catch (error) {
        setError(error.message);
      }
    };

    fetchNotes();
  }, []);

  // Handle creating a new note
  const handleCreateNote = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://127.0.0.1:8000/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newNoteTitle,
          content: newNoteContent,
        }),
      });

      if (!response.ok) throw new Error("Failed to create note");

      const newNote = await response.json();
      setNotes((prevNotes) => [...prevNotes, newNote]);
      setNewNoteTitle("");
      setNewNoteContent("");
      setIsCreateModalOpen(false);
    } catch (error) {
      setError(error.message);
    }
  };

  // Handle editing a note
  const handleEditNote = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://127.0.0.1:8000/notes/${currentNoteId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editNoteTitle,
          content: editNoteContent,
        }),
      });

      if (!response.ok) throw new Error("Failed to edit note");

      const updatedNote = await response.json();
      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === updatedNote.id ? updatedNote : note
        )
      );
      setIsEditModalOpen(false);
    } catch (error) {
      setError(error.message);
    }
  };

  // Handle deleting a note
  const handleDeleteNote = async (noteId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://127.0.0.1:8000/notes/${noteId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete note");

      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
    } catch (error) {
      setError(error.message);
    }
  };

  if (error) return <div>{error}</div>;

  return (
    <div className="container">
      <h1 className="title is-3">My Notes</h1>

      <button className="button is-primary" style={{ margin: '10px' }} onClick={() => setIsCreateModalOpen(true)}>
        Create Note
      </button>

      {notes.length > 0 ? (
        <ul>
          {notes.map((note) => (
            <li key={note.id} className="box">
              <p> <span className="has-text-weight-bold has-text-grey">Title:</span> <span className="has-text-link has-text-weight-bold" >{note.title}</span></p>
              <p><span className="has-text-weight-bold has-text-grey">Content:</span> {note.content}</p>
              <p></p>
              <button className="button is-link" style={{ margin: '10px' }}  onClick={() => {
                setIsEditModalOpen(true);
                setEditNoteTitle(note.title);
                setEditNoteContent(note.content);
                setCurrentNoteId(note.id);
              }}>
                Edit
              </button>
              <button className="button is-danger" style={{ margin: '10px' }}  onClick={() => handleDeleteNote(note.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No notes available.</p>
      )}

      {/* Create Note Modal */}
      {isCreateModalOpen && (
        <div className="modal is-active">
          <div className="modal-background" onClick={() => setIsCreateModalOpen(false)}></div>
          <div className="modal-content">
            <div className="box">
              <h2 className="title is-4">Create a New Note</h2>
              {error && <p className="has-text-danger">{error}</p>}
              <div className="field">
                <label className="label">Title</label>
                <div className="control">
                  <input
                    type="text"
                    className="input"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label className="label">Content</label>
                <div className="control">
                  <textarea
                    className="textarea"
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    required
                  ></textarea>
                </div>
              </div>
              <div className="field is-grouped is-grouped-right">
                <div className="control">
                  <button className="button is-link" onClick={handleCreateNote}>
                    Save Note
                  </button>
                </div>
                <div className="control">
                  <button className="button is-light" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
          <button className="modal-close is-large" aria-label="close" onClick={() => setIsCreateModalOpen(false)}></button>
        </div>
      )}

      {/* Edit Note Modal */}
      {isEditModalOpen && (
        <div className="modal is-active">
          <div className="modal-background" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="modal-content">
            <div className="box">
              <h2 className="title is-4">Edit Note</h2>
              {error && <p className="has-text-danger">{error}</p>}
              <div className="field">
                <label className="label">Title</label>
                <div className="control">
                  <input
                    type="text"
                    className="input"
                    value={editNoteTitle}
                    onChange={(e) => setEditNoteTitle(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label className="label">Content</label>
                <div className="control">
                  <textarea
                    className="textarea"
                    value={editNoteContent}
                    onChange={(e) => setEditNoteContent(e.target.value)}
                    required
                  ></textarea>
                </div>
              </div>
              <div className="field is-grouped is-grouped-right">
                <div className="control">
                  <button className="button is-link" onClick={handleEditNote}>
                    Save Changes
                  </button>
                </div>
                <div className="control">
                  <button className="button is-light" onClick={() => setIsEditModalOpen(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
          <button className="modal-close is-large" aria-label="close" onClick={() => setIsEditModalOpen(false)}></button>
        </div>
      )}
    </div>
  );
};

export default NotesPage;
