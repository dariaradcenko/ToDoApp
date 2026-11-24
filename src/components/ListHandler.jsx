import { useState, useEffect } from "react";
import { fetchLists } from "../services/listServices";
import { createTodo } from "../services/todoServices";
import NewTodoForm from "./NewTodoForm";
import ToDoList from "./ToDoList";
import SupervisorSuggestions from "./SupervisorSuggestions";
import "../pages/Taskpage.css";

export default function ListHandler({ userId }) {
  const [lists, setLists] = useState([]);
  const [refreshEvent, setRefreshEvent] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadLists() {
      try {
        setLoading(true);
        setLists([]);
        const result = await fetchLists();

        if (active) {
          setLists(result);
        }
      } catch (error) {
        if (active) {
          setError(error.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadLists();
    return () => {
      active = false;
    };
  }, [userId]);

  async function handleAdd(text, date, prio, listId) {
    await createTodo(text, date, prio, listId);

    setRefreshEvent((current) => ({
      listId,
      version: (current?.version ?? 0) + 1,
    }));
  }

  const taskLists = lists.filter((list) => list.type !== "supervisor");

  const sharedList = lists.find((list) => list.type === "shared");

  return (
    <main className="tasks-page">
      <header className="tasks-page__heading">
        <div>
          <p className="tasks-page__eyebrow">THESIS WORKSPACE</p>
          <h1>Task lists</h1>
          <p>
            Keep your own work organised, collaborate with your group, and
            review supervisor feedback.
          </p>
        </div>
      </header>

      {error && (
        <p className="tasks-page__error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="tasks-page__loading" role="status">
          Loading your lists…
        </p>
      ) : (
        <>
          <section
            className="tasks-page__composer"
            aria-labelledby="new-task-title"
          >
            <div className="tasks-page__section-heading">
              <div>
                <h2 id="new-task-title">Create a task</h2>
                <p>Add a task to your personal or shared thesis list.</p>
              </div>
            </div>
            <NewTodoForm onAdd={handleAdd} lists={taskLists} />
          </section>

          <div className="tasks-page__list-grid">
            {lists.map((list) => (
              <section
                key={list.id}
                className={`tasks-page__list-card tasks-page__list-card--${list.type}`}
                aria-label={list.name}
              >
                {list.type === "supervisor" ? (
                  <SupervisorSuggestions
                    listId={list.id}
                    sharedListId={sharedList?.id}
                    onSuggestionAccepted={() => {
                      if (!sharedList) return;
                      setRefreshEvent((current) => ({
                        listId: sharedList.id,
                        version: (current?.version ?? 0) + 1,
                      }));
                    }}
                  />
                ) : (
                  <ToDoList
                    listTitle={list.name}
                    listType={list.type}
                    listId={list.id}
                    refreshEvent={refreshEvent}
                  />
                )}
              </section>
            ))}
          </div>
          {lists.length === 0 && !error && (
            <p className="tasks-page__empty-workspace">
              No lists found. Check your lists in Back4App.
            </p>
          )}
        </>
      )}
    </main>
  );
}
