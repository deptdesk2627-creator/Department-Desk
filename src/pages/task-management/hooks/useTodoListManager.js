import { useEffect } from "react";
import { useStoredState } from "../../../hooks/useStoredState";

const DEFAULT_LISTS = [
  { id: "main", name: "Main To-Do List" },
  { id: "urgent", name: "Urgent & Priority" },
];
const LISTS_KEY = "officeflow.todo-lists";
const ACTIVE_LIST_KEY = "officeflow.active-list-id";

function isValidLists(value) {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (list) =>
        list &&
        typeof list.id === "string" &&
        typeof list.name === "string",
    )
  );
}

export function useTodoListManager(setTasks) {
  const [lists, setLists] = useStoredState(LISTS_KEY, DEFAULT_LISTS, {
    validate: isValidLists,
  });
  const [activeListId, setActiveListId] = useStoredState(
    ACTIVE_LIST_KEY,
    "main",
    { raw: true },
  );

  useEffect(() => {
    if (!lists.some((list) => list.id === activeListId)) {
      setActiveListId(lists[0]?.id || "main");
    }
  }, [activeListId, lists, setActiveListId]);

  function addList(name) {
    const listName = typeof name === "string" ? name.trim() : "";
    if (!listName) return;

    const newList = {
      id: `list-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: listName,
    };
    setLists((current) => [...current, newList]);
    setActiveListId(newList.id);
  }

  function deleteList(id, event) {
    if (event?.stopPropagation) event.stopPropagation();
    if (lists.length <= 1) {
      return;
    }

    const remaining = lists.filter((list) => list.id !== id);
    setLists(remaining);
    setTasks((current) =>
      (Array.isArray(current) ? current : []).filter(
        (task) => (task?.listId || "main") !== id,
      ),
    );
    if (activeListId === id) setActiveListId(remaining[0].id);
  }

  return {
    activeListId,
    addList,
    deleteList,
    lists,
    setActiveListId,
  };
}
