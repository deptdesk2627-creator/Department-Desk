import { useEffect, useState } from "react";

function normalizeStoredValue(key, storedValue, initialValue, validate) {
  if (validate) {
    if (!validate(storedValue)) {
      console.error(
        `Saved data for "${key}" is invalid; using the initial value.`,
      );
      return initialValue;
    }
    return storedValue;
  }

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

export function useStoredState(key, initialValue, options = {}) {
  const { raw = false, validate } = options;

  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") return initialValue;

    try {
      const storedValue = window.localStorage.getItem(key);
      if (storedValue === null) return initialValue;
      if (raw) return storedValue || initialValue;

      const parsedValue = JSON.parse(storedValue);
      return normalizeStoredValue(key, parsedValue, initialValue, validate);
    } catch (error) {
      console.error(`Could not read saved data for "${key}".`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    try {
      window.localStorage.setItem(
        key,
        raw ? String(value ?? "") : JSON.stringify(value),
      );
    } catch (error) {
      console.error(`Could not save data for "${key}".`, error);
    }

    return undefined;
  }, [key, value, raw]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    function handleStorage(event) {
      if (event.key !== null && event.key !== key) return;

      if (event.key === null || event.newValue === null) {
        setValue(initialValue);
        return;
      }

      if (raw) {
        setValue(event.newValue || initialValue);
        return;
      }

      try {
        const parsedValue = JSON.parse(event.newValue);
        if (validate && !validate(parsedValue)) {
          console.error(
            `Saved data for "${key}" is invalid; ignoring storage update.`,
          );
          return;
        }
        setValue(normalizeStoredValue(key, parsedValue, initialValue, validate));
      } catch (error) {
        console.error(`Could not read saved data for "${key}".`, error);
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [key, initialValue, raw, validate]);

  return [value, setValue];
}
