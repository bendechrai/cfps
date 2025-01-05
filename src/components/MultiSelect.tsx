import { useState, useRef, useEffect } from 'react';
import styles from './MultiSelect.module.css';

/**
 * Props for the MultiSelect component
 * @template T The type of the option values
 */
interface MultiSelectProps<T extends string | number> {
  /** Array of available options */
  options: T[];
  /** Set of currently selected options */
  selectedOptions: Set<T>;
  /** Callback when selection changes */
  onChange: (selected: Set<T>) => void;
  /** Placeholder text when no options are selected */
  placeholder: string;
}

/**
 * A dropdown component that allows selecting multiple options from a list
 * @template T The type of the option values (must be string or number)
 */
export function MultiSelect<T extends string | number>({ 
  options, 
  selectedOptions, 
  onChange, 
  placeholder 
}: MultiSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: T) => {
    const newSelected = new Set(selectedOptions);
    if (newSelected.has(option)) {
      newSelected.delete(option);
    } else {
      newSelected.add(option);
    }
    onChange(newSelected);
  };

  const removeOption = (option: T, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent opening dropdown
    const newSelected = new Set(selectedOptions);
    newSelected.delete(option);
    onChange(newSelected);
  };

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        type="button"
        className={`${styles.trigger} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className={styles.pillContainer}>
          {selectedOptions.size === 0 ? (
            <span className={styles.placeholder}>{placeholder}</span>
          ) : (
            Array.from(selectedOptions).map(option => (
              <span key={option} className={styles.pill}>
                {String(option)}
                <span
                  role="button"
                  tabIndex={0}
                  className={styles.pillRemove}
                  onClick={(e) => removeOption(option, e)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      removeOption(option, e as any);
                    }
                  }}
                  aria-label={`Remove ${String(option)}`}
                >
                  ×
                </span>
              </span>
            ))
          )}
        </div>
      </button>

      {isOpen && (
        <div 
          className={styles.dropdown}
          role="listbox"
          aria-label={placeholder}
          aria-multiselectable="true"
        >
          {options.map((option) => (
            <button
              key={option}
              type="button"
              className={`${styles.option} ${selectedOptions.has(option) ? styles.selected : ''}`}
              onClick={() => toggleOption(option)}
              role="option"
              aria-selected={selectedOptions.has(option)}
            >
              {String(option)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
