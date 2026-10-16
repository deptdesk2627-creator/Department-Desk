import { useEffect, useRef, useState } from "react";

export function useHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [areNotificationsOpen, setAreNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const profileRef = useRef(null);
  const profileButtonRef = useRef(null);
  const notificationRef = useRef(null);
  const notificationButtonRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!profileRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
      if (!notificationRef.current?.contains(event.target)) {
        setAreNotificationsOpen(false);
      }
    }

    function handleMouseDown(event) {
      if (!searchRef.current?.contains(event.target)) {
        setIsSearchOpen(false);
      }
    }

    function handleKeyDown(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (!isMenuOpen && !areNotificationsOpen) return;
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setAreNotificationsOpen(false);
        if (areNotificationsOpen) {
          notificationButtonRef.current?.focus();
        } else {
          profileButtonRef.current?.focus();
        }
        return;
      }

      if (areNotificationsOpen) return;
      const menuItems =
        profileRef.current?.querySelectorAll('[role="menuitem"]');
      if (!menuItems?.length || !profileRef.current?.contains(event.target)) {
        return;
      }

      const currentIndex = Array.from(menuItems).indexOf(
        document.activeElement,
      );
      let nextIndex;
      if (event.key === "ArrowDown") {
        nextIndex = (currentIndex + 1) % menuItems.length;
      } else if (event.key === "ArrowUp") {
        nextIndex = (currentIndex - 1 + menuItems.length) % menuItems.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = menuItems.length - 1;
      }

      if (nextIndex !== undefined) {
        event.preventDefault();
        menuItems[nextIndex].focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [areNotificationsOpen, isMenuOpen]);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function toggleProfileMenu() {
    setIsMenuOpen((open) => !open);
    setAreNotificationsOpen(false);
  }

  function toggleNotifications() {
    setAreNotificationsOpen((open) => !open);
    setIsMenuOpen(false);
  }

  function closeNotifications() {
    setAreNotificationsOpen(false);
  }

  return {
    areNotificationsOpen,
    closeNotifications,
    closeMenu,
    isMenuOpen,
    isSearchOpen,
    notificationButtonRef,
    notificationRef,
    profileButtonRef,
    profileRef,
    searchInputRef,
    searchRef,
    setIsSearchOpen,
    toggleNotifications,
    toggleProfileMenu,
  };
}
