import { useState, useRef, useEffect } from "react";
import styles from "../../app/cfps.module.css";

interface SingleSelectProps<T> {
  options: T[];
  value: T | null;
  onChange: (value: T) => void;
  placeholder?: string;
  getLabel?: (value: T) => string;
}

export function SingleSelect<T>({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  getLabel = String,
}: SingleSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={styles.triggerText}>
          {value !== null ? getLabel(value) : placeholder}
        </span>
        <span className={styles.arrow}>▼</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="listbox">
          {options.map((option) => (
            <button
              key={String(option)}
              type="button"
              className={`${styles.option} ${option === value ? styles.selected : ""}`}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              role="option"
              aria-selected={option === value}
            >
              {getLabel(option)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
