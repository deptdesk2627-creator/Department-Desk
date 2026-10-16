import "./DashboardPanels.css";
import EmptyState from "../../../../components/ui/EmptyState";
import StatusPill from "../../../../components/ui/StatusPill";

function DashboardTasksPanel({ tasks, hasQuery, onNavigate }) {
  return (
    <section
      className="card panel team-tasks-panel"
      aria-labelledby="tasks-title"
    >
      <div className="panel-heading">
        <h2 id="tasks-title">Tasks Management</h2>
        <button
          className="text-button"
          type="button"
          onClick={() => onNavigate("tasks")}
        >
          All tasks →
        </button>
      </div>
      {tasks.length > 0 ? (
        <div className="office-task-list">
          {tasks.map((task) => {
            const status = task.done ? "Done" : task.status || "Not started";
            return (
              <article className="office-task" key={task.id}>
                <div className="office-task-content">
                  <h3>{task.title}</h3>
                  <p>
                    {task.category} · {task.assignee}
                  </p>
                </div>
                <StatusPill status={status} />
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          hasQuery={hasQuery}
          queryMessage="No tasks match your search."
          defaultMessage="No tasks yet. Add a task to get started."
        />
      )}
    </section>
  );
}

export default DashboardTasksPanel;
