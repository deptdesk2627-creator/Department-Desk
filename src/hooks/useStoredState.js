import { useEffect, useState } from "react";

function normalizeStoredValue(key, storedValue, initialValue) {
  if (!Array.isArray(initialValue)) {
    return storedValue;
  }

  if (!Array.isArray(storedValue)) {
    console.error(
      `Saved data for "${key}" is not an array; using the initial value.`,
    );
    return initialValue;
  }

  return storedValue.filter((item) => item !== null && item !== undefined);
}

export function useStoredState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const storedValue = window.localStorage.getItem(key);
      if (storedValue === null) return initialValue;

      const parsedValue = JSON.parse(storedValue);
      return normalizeStoredValue(key, parsedValue, initialValue);
    } catch (error) {
      console.error(`Could not read saved data for "${key}".`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Could not save data for "${key}".`, error);
    }
  }, [key, value]);

  return [value, setValue];
}
