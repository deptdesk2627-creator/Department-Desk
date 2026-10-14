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
    if (typeof window === "undefined") return initialValue;

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
    if (typeof window === "undefined") return undefined;

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Could not save data for "${key}".`, error);
    }

    return undefined;
  }, [key, value]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    function handleStorage(event) {
      if (event.key !== null && event.key !== key) return;

      if (event.key === null || event.newValue === null) {
        setValue(initialValue);
        return;
      }

      try {
        const parsedValue = JSON.parse(event.newValue);
        setValue(normalizeStoredValue(key, parsedValue, initialValue));
      } catch (error) {
        console.error(`Could not read saved data for "${key}".`, error);
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [key, initialValue]);

  return [value, setValue];
}
