import { useEffect, useState } from "react";
import { Link, Navigate, NavLink, Route, Routes } from "react-router-dom";
import { currentUser, fetchHomepageTaskData } from "../services/ThesisService.js";
import { setTodoDone } from "../services/todoServices.js";
import AuthPage from "../pages/AuthPage.jsx";
import HomePage from "../pages/HomePage.jsx";
import DiscussionPage from "../pages/DiscussionPage.jsx";

// This wrapper belongs to the isolated homepage. Reuse the existing login component
// as it is, so signing in does not depend on the task app's missing component.
export default function HomepageApp({ configured }) {
  // Ask the service for a plain user id. The component handles the screen only.
  const [user, setUser] = useState(() => configured ? currentUser() : null);

  function handleAuthenticated() {
    // The existing AuthPage has completed login. Read the user through our service
    // instead of putting its raw Parse object into component state.
    setUser(currentUser());
  }

  if (!configured) {
    return <main className="homepage-login"><p>The project service is not configured. Please contact your team.</p></main>;
  }

  if (!user) {
    return (
      <main className="homepage-login">
        <p>Sign in with your team’s to-do app account to load your tasks.</p>
        <AuthPage onAuthenticated={handleAuthenticated} />
      </main>
    );
  }

  // Only signed-in users reach the workspace, so it needs no offline mode.
  return <Workspace key={user.id} userId={user.id} />;
}

// Task data and route selection stay together in this homepage-only component.
function Workspace({ userId }) {
  const [data, setData] = useState({ lists: [], todos: [], loading: true, error: "" });
  const [pendingIds, setPendingIds] = useState([]);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const result = await fetchHomepageTaskData();
        if (active) setData({ ...result, loading: false, error: "" });
      } catch {
        if (active) setData({ lists: [], todos: [], loading: false, error: "Tasks could not be loaded. Refresh the page to try again." });
      }
    }
    load();
    return () => { active = false; };
  }, [userId]);

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
      setData((current) => ({ ...current, todos: current.todos.map((item) => item.id === id ? { ...item, done: !todo.done } : item) }));
    } catch {
      setActionError("The task could not be saved. Its previous status is unchanged. Please try again.");
    } finally {
      setPendingIds((current) => current.filter((item) => item !== id));
    }
  }

  return (
    <div className="workspace-shell">
      <WorkspaceSidebar />
      <div className="workspace-content">
        {actionError && <p className="workspace-error" role="alert">{actionError}</p>}
        {/* Routes picks a screen from the URL, as in the professor's example. */}
        <Routes>
          <Route path="/overview" element={<HomePage lists={data.lists} todos={data.todos} loading={data.loading} error={data.error} pendingIds={pendingIds} onToggle={handleToggle} />} />
          <Route path="/reminders" element={<main className="workspace-placeholder"><h1>Reminders</h1><p>Reminders are not available yet.</p><Link to="/overview">Back to overview</Link></main>} />
          <Route path="/discussions" element={<DiscussionPage />} />
          <Route path="/homepage.html" element={<Navigate to="/overview" replace />} />
          <Route path="*" element={<main className="workspace-placeholder"><h1>Page not found</h1><Link to="/overview">Back to overview</Link></main>} />
        </Routes>
      </div>
    </div>
  );
}

// Text navigation uses NavLink to highlight the current page automatically.
function WorkspaceSidebar() {
  return (
    <aside className="workspace-sidebar">
      <p className="workspace-label">Workspace</p>
      {/* NavLink changes the page and marks the active link automatically. */}
      <nav aria-label="Workspace">
        <NavLink to="/overview">Overview</NavLink>
        <NavLink to="/reminders">Reminders</NavLink>
        <a href="/">Task lists</a>
        <NavLink to="/discussions">Discussions</NavLink>
      </nav>
    </aside>
  );
}
