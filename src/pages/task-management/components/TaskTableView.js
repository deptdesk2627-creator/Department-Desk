import "./TaskViews.css";
import TaskRow from "./TaskRow";

function TaskTableView({
  tasks,
  selectedTaskIds,
  todayStr,
  onSelectAll,
  onSelectOne,
  onToggleDone,
  onUpdateTask,
  onDeleteTask,
}) {
  return (
    <div className="deptdesk-card table-card">
      <table className="deptdesk-table">
        <thead>
          <tr>
            <th style={{ width: "30px" }}>
              <input
                type="checkbox"
                checked={
                  tasks.length > 0 && selectedTaskIds.length === tasks.length
                }
                onChange={onSelectAll}
              />
            </th>
            <th style={{ width: "30px" }}>Done</th>
            <th>Task Title</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Due Date</th>
            <th style={{ width: "40px" }}></th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              todayStr={todayStr}
              showSelection
              isSelected={selectedTaskIds.includes(task.id)}
              showStatus
              onSelectOne={onSelectOne}
              onToggleDone={onToggleDone}
              onUpdateTask={onUpdateTask}
              onDeleteTask={onDeleteTask}
            />
          ))}
          {!tasks.length && (
            <tr>
              <td colSpan="7" className="empty-state">
                No tasks in this list. Click above to add a new task!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default TaskTableView;
