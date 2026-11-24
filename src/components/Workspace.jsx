import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { fetchHomepageTaskData } from "../services/thesisServices.js";
import { setTodoDone } from "../services/todoServices.js";
import HomePage from "../pages/HomePage.jsx";
import ListHandler from "./ListHandler.jsx";

// Task data and route selection stay together in this homepage-only component.
export default function Workspace({ userId, onLogout }) {
  const { pathname } = useLocation();
  const [data, setData] = useState({
    lists: [],
    todos: [],
    loading: true,
    error: "",
  });
  const [pendingIds, setPendingIds] = useState([]);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const result = await fetchHomepageTaskData();
        if (active) setData({ ...result, loading: false, error: "" });
      } catch {
        if (active)
          setData({
            lists: [],
            todos: [],
            loading: false,
            error: "Tasks could not be loaded. Refresh the page to try again.",
          });
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [userId, pathname]);

  // Reuse the teammate's existing public save function without changing its code.
  // Update the homepage only after Back4App accepts the change.
  async function handleToggle(id) {
    if (pendingIds.includes(id)) return;
    const todo = data.todos.find((item) => item.id === id);
    if (!todo || !todo.canWrite) return;
    setPendingIds((current) => [...current, id]);
    setActionError("");
    try {
      await setTodoDone(id, !todo.done);
      setData((current) => ({
        ...current,
        todos: current.todos.map((item) =>
          item.id === id ? { ...item, done: !todo.done } : item,
        ),
      }));
    } catch {
      setActionError(
        "The task could not be saved. Its previous status is unchanged. Please try again.",
      );
    } finally {
      setPendingIds((current) => current.filter((item) => item !== id));
    }
  }

  return (
    <div className="workspace-shell">
      <WorkspaceSidebar onLogout={onLogout} />
      <div className="workspace-content">
        {actionError && (
          <p className="workspace-error" role="alert">
            {actionError}
          </p>
        )}
        {/* Routes picks a screen from the URL, as in the professor's example. */}
        <Routes>
          <Route
            path="/overview"
            element={
              <HomePage
                lists={data.lists}
                todos={data.todos}
                loading={data.loading}
                error={data.error}
                pendingIds={pendingIds}
                onToggle={handleToggle}
              />
            }
          />
          <Route
            path="/reminders"
            element={
              <main className="workspace-placeholder">
                <h1>Reminders</h1>
                <p>Reminders are not available yet.</p>
                <Link to="/overview">Back to overview</Link>
              </main>
            }
          />
          <Route
            path="/discussions"
            element={
              <main className="workspace-placeholder">
                <h1>Discussions</h1>
                <p>Discussions are not available yet.</p>
                <Link to="/overview">Back to overview</Link>
              </main>
            }
          />
          <Route
            path="*"
            element={
              <main className="workspace-placeholder">
                <h1>Page not found</h1>
                <Link to="/overview">Back to overview</Link>
              </main>
            }
          />
          <Route
            path="/tasks"
            element={
              <main className="workspace-placeholder">
                <ListHandler userId={userId} />
              </main>
            }
          />
        </Routes>
      </div>
    </div>
  );
}

// Text navigation uses NavLink to highlight the current page automatically.
function WorkspaceSidebar({ onLogout }) {
  return (
    <aside className="workspace-sidebar">
      <p className="workspace-label">Workspace</p>
      <nav aria-label="Workspace">
        <NavLink to="/overview">Overview</NavLink>
        <NavLink to="/reminders">Reminders</NavLink>
        <NavLink to="/tasks">Task lists</NavLink>
        <NavLink to="/discussions">Discussions</NavLink>
      </nav>
      <button type="button" className="workspace-logout" onClick={onLogout}>
        Log out
      </button>
    </aside>
  );
}
