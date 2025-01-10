import { useState, useRef, useEffect } from "react";
import styles from "../../app/cfps.module.css";

interface MultiSelectProps<T> {
  options: T[];
  selectedOptions: Set<T>;
  onChange: (selected: Set<T>) => void;
  placeholder?: string;
}

export function MultiSelect<T extends string>({
  options,
  selectedOptions,
  onChange,
  placeholder = "Select options...",
}: MultiSelectProps<T>) {
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

  const handleOptionClick = (option: T) => {
    const newSelected = new Set(selectedOptions);
    if (selectedOptions.has(option)) {
      newSelected.delete(option);
    } else {
      newSelected.add(option);
    }
    onChange(newSelected);
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className={styles.pillContainer}>
          {selectedOptions.size === 0 ? (
            <span className={styles.placeholder}>{placeholder}</span>
          ) : (
            Array.from(selectedOptions).map((option) => (
              <span key={option} className={styles.pill}>
                {option}
              </span>
            ))
          )}
        </div>
        <span className={styles.arrow}>▼</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown} role="listbox">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              className={`${styles.option} ${selectedOptions.has(option) ? styles.selected : ""}`}
              onClick={() => handleOptionClick(option)}
              role="option"
              aria-selected={selectedOptions.has(option)}
            >
              <span className={styles.checkbox}>
                {selectedOptions.has(option) && "✓"}
              </span>
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
