import { useState, useRef, useEffect } from 'react';
import styles from './MultiSelect.module.css';

/**
 * Props for the MultiSelect component
 * @template T The type of the option values
 */
interface MultiSelectProps<T> {
  /** Array of available options */
  options: T[];
  /** Set of currently selected options */
  selected: Set<T>;
  /** Callback when selection changes */
  onChange: (selected: Set<T>) => void;
  /** Function to get the label for an option */
  getOptionLabel: (option: T) => string;
}

/**
 * A dropdown component that allows selecting multiple options from a list
 * @template T The type of the option values
 */
export function MultiSelect<T>({
  options,
  selected,
  onChange,
  getOptionLabel
}: MultiSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: T) => {
    const newSelected = new Set(selected);
    if (newSelected.has(option)) {
      newSelected.delete(option);
    } else {
      newSelected.add(option);
    }
    onChange(newSelected);
  };

  const selectedText = selected.size > 0
    ? Array.from(selected).map(getOptionLabel).join(', ')
    : 'Select options...';

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={styles.trigger}
        aria-expanded={isOpen}
      >
        <span className={styles.selectedText}>{selectedText}</span>
        <span className={styles.arrow}>▼</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {options.map((option, index) => (
            <button
              key={index}
              className={`${styles.option} ${selected.has(option) ? styles.selected : ''}`}
              onClick={() => toggleOption(option)}
            >
              <input
                type="checkbox"
                checked={selected.has(option)}
                onChange={() => {}}
                className={styles.checkbox}
              />
              <span>{getOptionLabel(option)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
