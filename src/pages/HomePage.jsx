import { useEffect, useState } from "react";
import { PROJECT_STATUSES, loadProject, saveProject } from "../services/ThesisService.js";
import { formatTaskDate, getTaskOverview } from "../utils/taskDates.js";

export default function HomePage({ lists, todos, loading, error, pendingIds, onToggle }) {
  // The page keeps only saved project data. ProjectEditor owns the temporary draft.
  const [project, setProject] = useState(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");
  const { tasks, openTasks } = getTaskOverview(todos, lists);
  const currentTask = tasks.find((todo) => todo.id === project?.currentTaskId) || openTasks[0];

  // Load the signed-in user's saved online project when this view opens.
  // A failed load stays visible and blocks editing, so we do not overwrite unseen data.
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const saved = await loadProject();
        if (active) { setProject(saved); setProjectError(""); }
      } catch (err) {
        if (active) setProjectError(err.message);
      } finally {
        if (active) setProjectLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  async function handleSave(draft) {
    // One service call cleans, validates, and saves the whole object.
    // Errors go back to ProjectEditor, which keeps the draft open for correction.
    const savedProject = await saveProject(draft);
    setProject(savedProject);
    setMessage("Saved online");
    setIsEditing(false);
  }

  // Progress is calculated from saved dates, so editing the deadline does not
  // require storing or updating a second percentage in the database.
  const today = new Date();
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const start = project ? new Date(project.startDate).getTime() : 0;
  const end = project ? new Date(project.deadline).getTime() : 0;
  let timelinePercent = 0;
  if (project) {
    const totalTime = end - start;
    const elapsedTime = now - start;
    const percentage = Math.round((elapsedTime / totalTime) * 100);
    // Keep the bar between 0% (before the start) and 100% (after the deadline).
    timelinePercent = Math.max(0, Math.min(100, percentage));
  }

  return (
    <main id="overview" className="home-page">
      <header className="home-header">
        <div className="home-heading-row">
          <h1>{project ? `Welcome, ${project.name}` : "Welcome"}</h1>
          <div className="home-heading-actions">
            <span className="save-message" role="status">{projectLoading ? "Loading project…" : message}</span>
            <button className="edit-project-button" type="button" disabled={!project || projectLoading || Boolean(projectError)} aria-expanded={isEditing} aria-controls="project-details" onClick={() => { setIsEditing(true); setMessage(""); }}>Edit project</button>
          </div>
        </div>
        <p>Here’s what’s happening with your thesis today.</p>
      </header>

      {projectError && <p className="workspace-error" role="alert">{projectError} Refresh the page to try again.</p>}

      {/* Swap one simple form for the saved card. There are no duplicated editable
          fields in headings or in the timeline; each value is submitted once. */}
      {project && <section id="project-details" className="project-card" aria-label="Project details">
        {isEditing ? (
          <ProjectEditor project={project} tasks={tasks} tasksLoading={loading || Boolean(error)} onSave={handleSave} onCancel={() => setIsEditing(false)} />
        ) : <>
          <div className="project-overview">
            <span className="project-status">{project.status}</span>
            <h2 className="project-title">Project: {project.title}</h2>
            <p className="task-label">Current task</p>
            <div className="current-task">
              {currentTask ? (
                <a className={`current-task-link${currentTask.done ? " task-completed" : ""}`} href="/">{currentTask.text}</a>
              ) : loading ? <span>Loading tasks…</span> : error ? <span>Tasks unavailable</span> : <a className="current-task-link" href="/">Add a task to get started</a>}
              {currentTask && <button className="task-button complete-task-button" type="button" disabled={!currentTask.canWrite || pendingIds.includes(currentTask.id)} onClick={() => onToggle(currentTask.id)} title={currentTask.canWrite ? "" : "You have read-only access to this task"}>{currentTask.done ? "Mark as not done" : "Mark as done"}</button>}
            </div>
            <div className="project-details">
              <p><span>Final deadline: <time dateTime={project.deadline} title={project.deadline}>{formatTaskDate(project.deadline, { month: "long", day: "numeric" })}</time></span></p>
              <p><span>{project.memberCount} group {project.memberCount === 1 ? "member" : "members"}</span></p>
            </div>
          </div>
          <div className="project-timeline">
            <p id="timeline-label">Project timeline</p>
            <div className="timeline-track" role="progressbar" aria-labelledby="timeline-label" aria-valuemin={0} aria-valuemax={100} aria-valuenow={timelinePercent} aria-valuetext={`${timelinePercent}% of the project timeline has elapsed`}>
              <div className="timeline-elapsed" style={{ width: `${timelinePercent}%` }} />
            </div>
            <div className="timeline-dates">
              <span>{now < start ? "Starts" : "Started"} <time dateTime={project.startDate} title={project.startDate}>{formatTaskDate(project.startDate)}</time></span>
              <span>Deadline <time dateTime={project.deadline} title={project.deadline}>{formatTaskDate(project.deadline)}</time></span>
            </div>
          </div>
        </>}
      </section>}

      <TaskOverview todos={todos} lists={lists} loading={loading} error={error} pendingIds={pendingIds} onToggle={onToggle} />
    </main>
  );
}

// One form holds one draft object. It reports that object to the page on Save;
// the parent page passes it to the Back4App service.
function ProjectEditor({ project, tasks, tasksLoading, onSave, onCancel }) {
  const [draft, setDraft] = useState({ ...project });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    // The input name matches a property, so this replaces just that field.
    const { name, value } = event.target;
    setDraft({ ...draft, [name]: value });
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      // Wait for the service to finish its online save before closing the editor.
      // Keep the draft open if validation or saving fails.
      await onSave(draft);
    } catch (err) {
      setError(err.message || "Project details could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form id="project-editor" className="project-editor" onSubmit={handleSubmit} aria-labelledby="editor-title">
      <h2 id="editor-title">Edit project</h2>
      {/* A fieldset disables all fields and both buttons together while saving. */}
      <fieldset disabled={saving}>
        <legend className="visually-hidden">Project details</legend>
        <div className="project-editor-fields">
          <label>Your name<input name="name" value={draft.name} onChange={handleChange} required /></label>
          <label>Project name<input name="title" value={draft.title} onChange={handleChange} required /></label>
          <label>Status<select name="status" value={draft.status} onChange={handleChange}>
            {PROJECT_STATUSES.map((status) => <option key={status}>{status}</option>)}
          </select></label>
          <label>Current task<select name="currentTaskId" value={draft.currentTaskId} onChange={handleChange} disabled={tasksLoading || tasks.length === 0}>
            <option value="">Choose automatically</option>
            {draft.currentTaskId && !tasks.some((task) => task.id === draft.currentTaskId) && <option value={draft.currentTaskId}>Saved task unavailable</option>}
            {tasks.map((task) => <option key={task.id} value={task.id}>{task.text}{task.done ? " (done)" : ""}</option>)}
          </select></label>
          <label>Start date<input type="date" name="startDate" value={draft.startDate} onChange={handleChange} required /></label>
          <label>Deadline<input type="date" name="deadline" value={draft.deadline} min={draft.startDate} onChange={handleChange} required /></label>
          <label>Group members<input type="number" name="memberCount" value={draft.memberCount} min="1" step="1" onChange={handleChange} required /></label>
        </div>
        <p className="project-save-note">Project details are saved online to your account.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="project-edit-actions">
          <button className="task-button" type="submit">{saving ? "Saving…" : "Save project"}</button>
          <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>
        </div>
      </fieldset>
    </form>
  );
}

// These two cards display task data supplied by the parent workspace.
function TaskOverview({ todos, lists, loading, error, pendingIds, onToggle }) {
  const { openTasks, focus, upcoming } = getTaskOverview(todos, lists);

  return (
    <div className="home-task-panels">
      <section className="summary-card" aria-labelledby="focus-title">
        <header className="summary-heading">
          <div>
            <h2 id="focus-title">Focus for today</h2>
            <p>{loading ? "Loading tasks…" : error ? "Tasks unavailable" : `${openTasks.length} ${openTasks.length === 1 ? "task" : "tasks"} left to complete`}</p>
          </div>
          {/* Open the teammate's original task page without changing its components. */}
          <a href="/">View all</a>
        </header>
        {error ? (
          <p className="summary-empty" role="alert">{error}</p>
        ) : loading ? (
          <p className="summary-empty" role="status">Loading your task lists…</p>
        ) : focus.length === 0 ? (
          <p className="summary-empty">No unfinished tasks. <a href="/">Open task lists</a> to get started.</p>
        ) : (
          <ul className="focus-list">
            {focus.map((todo) => (
              <li key={todo.id}>
                {/* This checkbox calls the same save function as the task list checkbox. */}
                <input type="checkbox" checked={todo.done} disabled={!todo.canWrite || pendingIds.includes(todo.id)} onChange={() => onToggle(todo.id)} aria-label={`Mark ${todo.text} as done`} title={todo.canWrite ? "" : "You have read-only access to this task"} />
                <a className="task-link" href="/">{todo.text}</a>
                <span className="task-due">{formatTaskDate(todo.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="summary-card" aria-labelledby="upcoming-title">
        <header className="summary-heading">
          <div><h2 id="upcoming-title">Coming up</h2><p>Next 7 days</p></div>
        </header>
        {loading ? <p className="summary-empty" role="status">Loading deadlines…</p> : error ? (
          <p className="summary-empty">Deadlines will appear when your task lists can be loaded.</p>
        ) : upcoming.length === 0 ? (
          <p className="summary-empty">No unfinished tasks due in the next 7 days.</p>
        ) : (
          <ul className="upcoming-list">
            {upcoming.map((todo) => (
              <li key={todo.id}>
                <a href="/">
                  <span className="date-badge" aria-hidden="true">
                    <span>{formatTaskDate(todo.date, { month: "short" })}</span>
                    <strong>{formatTaskDate(todo.date, { day: "numeric" })}</strong>
                  </span>
                  <span>{todo.text}<span className="visually-hidden">, due {formatTaskDate(todo.date)}</span></span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
