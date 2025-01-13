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

  const removeOption = (option: T, event: React.MouseEvent) => {
    event.stopPropagation();
    const newSelected = new Set(selected);
    newSelected.delete(option);
    onChange(newSelected);
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <div 
        className={`${styles.trigger} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={styles.pillContainer}>
          {selected.size === 0 ? (
            <span className={styles.placeholder}>All continents</span>
          ) : (
            Array.from(selected).map((option) => (
              <span key={getOptionLabel(option)} className={styles.pill}>
                {getOptionLabel(option)}
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={(e) => removeOption(option, e)}
                  aria-label={`Remove ${getOptionLabel(option)}`}
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
        <span className={styles.arrow}>▼</span>
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          {options.map((option) => (
            <div
              key={getOptionLabel(option)}
              className={`${styles.option} ${selected.has(option) ? styles.selected : ''}`}
              onClick={() => toggleOption(option)}
            >
              {getOptionLabel(option)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
