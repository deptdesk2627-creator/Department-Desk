import TaskManagement from "../secretary/task-management/TaskManagement";

// Dean can create, assign, and update tasks like the Secretary.
function DeanTasks({ data, search }) {
  return (
    <TaskManagement tasks={data.tasks} setTasks={data.setTasks} search={search} />
  );
}

export default DeanTasks;
