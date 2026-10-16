import { useEffect, useState } from "react";

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

function readLists() {
  if (typeof window === "undefined") return DEFAULT_LISTS;
  try {
    const storedValue = window.localStorage.getItem(LISTS_KEY);
    if (storedValue === null) return DEFAULT_LISTS;
    const lists = JSON.parse(storedValue);
    if (!isValidLists(lists)) {
      console.error("Saved to-do lists are invalid; using the default lists.");
      return DEFAULT_LISTS;
    }
    return lists;
  } catch (error) {
    console.error("Could not read saved to-do lists.", error);
    return DEFAULT_LISTS;
  }
}

function readActiveListId() {
  if (typeof window === "undefined") return "main";
  try {
    return window.localStorage.getItem(ACTIVE_LIST_KEY) || "main";
  } catch (error) {
    console.error("Could not read the active to-do list.", error);
    return "main";
  }
}

export function useTodoListManager(setTasks) {
  const [lists, setLists] = useState(readLists);
  const [activeListId, setActiveListId] = useState(readActiveListId);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(LISTS_KEY, JSON.stringify(lists));
    } catch (error) {
      console.error("Could not save to-do lists.", error);
    }
  }, [lists]);

  useEffect(() => {
    if (!lists.some((list) => list.id === activeListId)) {
      setActiveListId(lists[0]?.id || "main");
      return;
    }

    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(ACTIVE_LIST_KEY, activeListId);
    } catch (error) {
      console.error("Could not save the active to-do list.", error);
    }
  }, [activeListId, lists]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    function handleStorage(event) {
      if (event.key === LISTS_KEY || event.key === null) {
        if (event.newValue === null) {
          setLists(DEFAULT_LISTS);
        } else {
          try {
            const parsedLists = JSON.parse(event.newValue);
            if (!isValidLists(parsedLists)) {
              console.error("Saved to-do lists are invalid; ignoring storage update.");
              return;
            }
            setLists(parsedLists);
          } catch (error) {
            console.error("Could not read saved to-do lists.", error);
          }
        }
      }

      if (event.key === ACTIVE_LIST_KEY || event.key === null) {
        setActiveListId(event.newValue || "main");
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

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
