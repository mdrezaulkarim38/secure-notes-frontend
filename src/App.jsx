import { useEffect, useState } from "react";
import { api } from "./api.js";

function useAsync(fn, deps) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    fn()
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, deps);
  return { data, error, loading };
}

function AuthView({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("arif@test.com");
  const [password, setPassword] = useState("Pass1234");
  const [interests, setInterests] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      if (mode === "login") {
        const r = await api.login({ email, password });
        onAuth(r.token, r.user);
      } else {
        const list = interests
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        await api.register({ name, email, password, interests: list });
        const r = await api.login({ email, password });
        onAuth(r.token, r.user);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2>{mode === "login" ? "Login" : "Register"}</h2>
      <form onSubmit={submit}>
        {mode === "register" && (
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
        )}
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        {mode === "register" && (
          <input
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="Interests comma separated"
          />
        )}
        <button type="submit">{mode === "login" ? "Login" : "Register"}</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button onClick={() => setMode(mode === "login" ? "register" : "login")}>
        Switch to {mode === "login" ? "register" : "login"}
      </button>
    </div>
  );
}

function NotesView({ token }) {
  const [refresh, setRefresh] = useState(0);
  const [page, setPage] = useState(1);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const { data, error: loadError, loading } = useAsync(
    () => api.listNotes(token, page, 10),
    [page, refresh]
  );

  async function create(e) {
    e.preventDefault();
    setError("");
    try {
      await api.createNote(token, { title, content });
      setTitle("");
      setContent("");
      setRefresh((r) => r + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveEdit(id) {
    setError("");
    try {
      await api.updateNote(token, id, { title: editing.title, content: editing.content });
      setEditing(null);
      setRefresh((r) => r + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    setError("");
    try {
      await api.deleteNote(token, id);
      setRefresh((r) => r + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2>My Notes</h2>
      <form onSubmit={create}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required />
        <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="Content" required />
        <button type="submit">Add</button>
      </form>
      {(error || loadError) && <p style={{ color: "red" }}>{error || loadError}</p>}
      {loading && <p>Loading...</p>}
      {data && data.items.length === 0 && <p>No notes yet.</p>}
      {data &&
        data.items.map((n) =>
          editing && editing.id === n._id ? (
            <div key={n._id}>
              <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              <input value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} />
              <button onClick={() => saveEdit(n._id)}>Save</button>
              <button onClick={() => setEditing(null)}>Cancel</button>
            </div>
          ) : (
            <div key={n._id} style={{ border: "1px solid #ccc", margin: "4px", padding: "4px" }}>
              <strong>{n.title}</strong>
              <p>{n.content}</p>
              <button onClick={() => setEditing({ id: n._id, title: n.title, content: n.content })}>Edit</button>
              <button onClick={() => remove(n._id)}>Delete</button>
            </div>
          )
        )}
      {data && (
        <div>
          <span>
            Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)
          </span>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Prev
          </button>
          <button
            disabled={data && page >= data.pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function PostsView({ token, user }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");
  const { data, error: loadError, loading } = useAsync(
    () => api.userPosts(user.id, 1, 10),
    [refresh]
  );

  async function create(e) {
    e.preventDefault();
    setError("");
    try {
      await api.createPost(token, { title, content });
      setTitle("");
      setContent("");
      setRefresh((r) => r + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2>My Posts</h2>
      <form onSubmit={create}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required />
        <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="Content" required />
        <button type="submit">Publish</button>
      </form>
      {(error || loadError) && <p style={{ color: "red" }}>{error || loadError}</p>}
      {loading && <p>Loading...</p>}
      {data && data.items.length === 0 && <p>No posts yet.</p>}
      {data &&
        data.items.map((p) => (
          <div key={p._id} style={{ border: "1px solid #ccc", margin: "4px", padding: "4px" }}>
            <strong>{p.title}</strong>
            <p>{p.content}</p>
          </div>
        ))}
    </div>
  );
}

function AdminView({ token }) {
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const { data: users, error: userError } = useAsync(() => api.adminUsers(token, 1, 20), [refresh]);
  const { data: notes } = useAsync(() => api.adminNotes(token, 1, 20), [refresh]);
  const { data: interests } = useAsync(() => api.usersByInterest(token, 1, 20), [refresh]);

  async function createUser(e) {
    e.preventDefault();
    setError("");
    try {
      await api.adminCreateUser(token, { name: "New", email: newEmail, password: "Pass1234" });
      setNewEmail("");
      setRefresh((r) => r + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeUser(id) {
    setError("");
    try {
      await api.adminDeleteUser(token, id);
      setRefresh((r) => r + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2>Admin</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {userError && <p style={{ color: "red" }}>{userError}</p>}
      <form onSubmit={createUser}>
        <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="New user email" required />
        <button type="submit">Create user (Pass1234)</button>
      </form>
      <h3>Users</h3>
      {users &&
        users.items.map((u) => (
          <div key={u.id}>
            {u.name} ({u.email}) [{u.role}]
            <button onClick={() => removeUser(u.id)}>Delete</button>
          </div>
        ))}
      <h3>All notes ({notes ? notes.pagination.total : "?"})</h3>
      {notes &&
        notes.items.map((n) => (
          <div key={n._id}>
            {n.title} — by {n.userId && (n.userId.name || n.userId.email)}
          </div>
        ))}
      <h3>By interest</h3>
      {interests &&
        interests.items.map((g) => (
          <div key={g.interest}>
            <strong>{g.interest}</strong> ({g.count}): {g.users.map((u) => u.name).join(", ")}
          </div>
        ))}
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));
  const [tab, setTab] = useState("notes");

  function onAuth(t, u) {
    setToken(t);
    setUser(u);
    localStorage.setItem("token", t);
    localStorage.setItem("user", JSON.stringify(u));
  }

  function logout() {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  if (!token || !user) return <AuthView onAuth={onAuth} />;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 12 }}>
      <header>
        <span>
          {user.name} ({user.role})
        </span>{" "}
        <button onClick={logout}>Logout</button>
      </header>
      <nav>
        <button onClick={() => setTab("notes")}>Notes</button>
        <button onClick={() => setTab("posts")}>Posts</button>
        {user.role === "Admin" && <button onClick={() => setTab("admin")}>Admin</button>}
      </nav>
      {tab === "notes" && <NotesView token={token} />}
      {tab === "posts" && <PostsView token={token} user={user} />}
      {tab === "admin" && user.role === "Admin" && <AdminView token={token} />}
    </div>
  );
}
