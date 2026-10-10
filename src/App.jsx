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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [interests, setInterests] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
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
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="card shadow auth-card">
        <div className="card-body p-4">
          <h3 className="card-title text-center mb-1">Secure Notes</h3>
          <p className="text-center text-muted mb-4">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </p>
          <ul className="nav nav-pills nav-fill mb-3">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link${mode === "login" ? " active" : ""}`}
                onClick={() => setMode("login")}
              >
                Login
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link${mode === "register" ? " active" : ""}`}
                onClick={() => setMode("register")}
              >
                Register
              </button>
            </li>
          </ul>
          <form onSubmit={submit}>
            {mode === "register" && (
              <div className="mb-3">
                <label className="form-label">Name</label>
                <input
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
            )}
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "register" ? "Min 6 characters" : "Your password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
              />
            </div>
            {mode === "register" && (
              <div className="mb-3">
                <label className="form-label">Interests</label>
                <input
                  className="form-control"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="chess, reading"
                />
              </div>
            )}
            {error && <div className="alert alert-danger">{error}</div>}
            <button type="submit" className="btn btn-primary w-100" disabled={busy}>
              {busy ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
            </button>
          </form>
        </div>
      </div>
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
  const [saving, setSaving] = useState(false);
  const { data, error: loadError, loading } = useAsync(
    () => api.listNotes(token, page, 10),
    [page, refresh]
  );

  async function create(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.createNote(token, { title, content });
      setTitle("");
      setContent("");
      setRefresh((r) => r + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
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
    if (!window.confirm("Delete this note?")) return;
    setError("");
    try {
      await api.deleteNote(token, id);
      setRefresh((r) => r + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  const totalPages = data ? data.pagination.totalPages : 0;

  return (
    <div>
      <div className="page-head">
        <h4>My Notes</h4>
        <p>Private to you. Only you can see these.</p>
      </div>
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="card-title">New note</h5>
          <form onSubmit={create}>
            <div className="mb-2">
              <input
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                maxLength={200}
                required
              />
            </div>
            <div className="mb-2">
              <textarea
                className="form-control"
                rows={2}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note..."
                maxLength={2000}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Add note"}
            </button>
          </form>
        </div>
      </div>
      {(error || loadError) && <div className="alert alert-danger">{error || loadError}</div>}
      {loading && (
        <div className="text-center my-4">
          <div className="spinner-border" role="status" />
        </div>
      )}
      {data && data.items.length === 0 && (
        <div className="alert alert-info">No notes yet. Create your first note above.</div>
      )}
      <div className="row g-3">
        {data &&
          data.items.map((n) => (
            <div key={n._id} className="col-md-6">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  {editing && editing.id === n._id ? (
                    <>
                      <input
                        className="form-control mb-2"
                        value={editing.title}
                        onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                      />
                      <textarea
                        className="form-control mb-2"
                        rows={2}
                        value={editing.content}
                        onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                      />
                      <button className="btn btn-sm btn-success me-2" onClick={() => saveEdit(n._id)}>
                        Save
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={() => setEditing(null)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <h5 className="card-title">{n.title}</h5>
                      <p className="card-text text-muted">{n.content}</p>
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => setEditing({ id: n._id, title: n.title, content: n.content })}
                      >
                        Edit
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => remove(n._id)}>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
      {data && totalPages > 0 && (
        <nav className="mt-4">
          <ul className="pagination justify-content-center">
            <li className={`page-item${page <= 1 ? " disabled" : ""}`}>
              <button className="page-link" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
                Previous
              </button>
            </li>
            <li className="page-item disabled">
              <span className="page-link">
                Page {data.pagination.page} of {totalPages} ({data.pagination.total} total)
              </span>
            </li>
            <li className={`page-item${page >= totalPages ? " disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}

function PostsView({ token, user }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const { data, error: loadError, loading } = useAsync(
    () => api.userPosts(user.id, 1, 10),
    [refresh]
  );

  async function create(e) {
    e.preventDefault();
    setError("");
    setPublishing(true);
    try {
      await api.createPost(token, { title, content });
      setTitle("");
      setContent("");
      setRefresh((r) => r + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <h4>My Posts</h4>
        <p>Published posts. Visible to everyone.</p>
      </div>
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="card-title">Publish a post</h5>
          <p className="text-muted small">Posts are visible to everyone.</p>
          <form onSubmit={create}>
            <div className="mb-2">
              <input
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post title"
                maxLength={200}
                required
              />
            </div>
            <div className="mb-2">
              <textarea
                className="form-control"
                rows={2}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What is on your mind?"
                maxLength={2000}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={publishing}>
              {publishing ? "Publishing..." : "Publish"}
            </button>
          </form>
        </div>
      </div>
      {(error || loadError) && <div className="alert alert-danger">{error || loadError}</div>}
      {loading && (
        <div className="text-center my-4">
          <div className="spinner-border" role="status" />
        </div>
      )}
      {data && data.items.length === 0 && <div className="alert alert-info">No posts yet.</div>}
      {data &&
        data.items.map((p) => (
          <div key={p._id} className="card shadow-sm mb-3">
            <div className="card-body">
              <h5 className="card-title">{p.title}</h5>
              <p className="card-text">{p.content}</p>
              <small className="text-muted">{new Date(p.createdAt).toLocaleString()}</small>
            </div>
          </div>
        ))}
    </div>
  );
}

function AdminView({ token }) {
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const { data: users, error: userError } = useAsync(() => api.adminUsers(token, 1, 20), [refresh]);
  const { data: notes } = useAsync(() => api.adminNotes(token, 1, 20), [refresh]);
  const { data: interests } = useAsync(() => api.usersByInterest(token, 1, 20), [refresh]);

  async function createUser(e) {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      await api.adminCreateUser(token, { name: newName, email: newEmail, password: "Pass1234" });
      setNewName("");
      setNewEmail("");
      setRefresh((r) => r + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function removeUser(id) {
    if (!window.confirm("Delete this user and all their notes and posts?")) return;
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
      <div className="page-head">
        <h4>Administration</h4>
        <p>Manage users, review all notes and interest groups.</p>
      </div>
      {(error || userError) && <div className="alert alert-danger">{error || userError}</div>}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="card-title">Create user</h5>
          <form onSubmit={createUser} className="row g-2">
            <div className="col-md-5">
              <input
                className="form-control"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Name"
                required
              />
            </div>
            <div className="col-md-5">
              <input
                type="email"
                className="form-control"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Email"
                required
              />
            </div>
            <div className="col-md-2">
              <button type="submit" className="btn btn-primary w-100" disabled={creating}>
                {creating ? "..." : "Create"}
              </button>
            </div>
          </form>
          <small className="text-muted">Default password: Pass1234</small>
        </div>
      </div>
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="card-title">Users ({users ? users.pagination.total : "?"})</h5>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users &&
                  users.items.map((u) => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === "Admin" ? "bg-danger" : "bg-secondary"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="text-end">
                        <button className="btn btn-sm btn-outline-danger" onClick={() => removeUser(u.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="card-title">All notes ({notes ? notes.pagination.total : "?"})</h5>
          {notes &&
            notes.items.map((n) => (
              <div key={n._id} className="border-bottom py-2">
                <strong>{n.title}</strong>{" "}
                <span className="text-muted">by {n.userId && (n.userId.name || n.userId.email)}</span>
              </div>
            ))}
        </div>
      </div>
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="card-title">Users by interest</h5>
          {interests &&
            interests.items.map((g) => (
              <div key={g.interest} className="mb-2">
                <span className="badge bg-primary me-2">{g.interest}</span>
                <span className="text-muted">
                  ({g.count}) {g.users.map((u) => u.name).join(", ")}
                </span>
              </div>
            ))}
        </div>
      </div>
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
    setTab("notes");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  if (!token || !user)
    return (
      <div className="app-bg">
        <AuthView onAuth={onAuth} />
      </div>
    );

  return (
    <div className="app-bg">
      <nav className="navbar navbar-expand navbar-dark app-navbar shadow-sm">
        <div className="container">
          <span className="navbar-brand">Secure Notes</span>
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link btn btn-link${tab === "notes" ? " active" : ""}`}
                onClick={() => setTab("notes")}
              >
                Notes
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link btn btn-link${tab === "posts" ? " active" : ""}`}
                onClick={() => setTab("posts")}
              >
                Posts
              </button>
            </li>
            {user.role === "Admin" && (
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link btn btn-link${tab === "admin" ? " active" : ""}`}
                  onClick={() => setTab("admin")}
                >
                  Admin
                </button>
              </li>
            )}
          </ul>
          <span className="navbar-text me-3">
            {user.name}{" "}
            <span className={`badge ${user.role === "Admin" ? "bg-danger" : "bg-secondary"}`}>
              {user.role}
            </span>
          </span>
          <button className="btn btn-sm btn-outline-light" onClick={logout}>
            Logout
          </button>
        </div>
      </nav>
      <main className="container py-4">
        {tab === "notes" && <NotesView token={token} />}
        {tab === "posts" && <PostsView token={token} user={user} />}
        {tab === "admin" && user.role === "Admin" && <AdminView token={token} />}
      </main>
    </div>
  );
}
