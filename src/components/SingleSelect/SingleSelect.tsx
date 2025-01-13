import { useState, useRef, useEffect } from 'react';
import styles from './SingleSelect.module.css';

/**
 * Props for the SingleSelect component
 * @template T The type of the option values
 */
interface SingleSelectProps<T> {
  /** Array of available options */
  options: readonly T[];
  /** Currently selected value */
  selected: T;
  /** Callback when selection changes */
  onChange: (value: T) => void;
  /** Function to convert option value to display label */
  getOptionLabel: (option: T) => string;
}

/**
 * A dropdown component that allows selecting a single option from a list
 * @template T The type of the option values
 */
export function SingleSelect<T>({ 
  options, 
  selected, 
  onChange,
  getOptionLabel 
}: SingleSelectProps<T>) {
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

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={styles.trigger}
        aria-expanded={isOpen}
      >
        <span>{getOptionLabel(selected)}</span>
        <span className={styles.arrow}>▼</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {options.map((option, index) => (
            <button
              key={index}
              className={`${styles.option} ${option === selected ? styles.selected : ''}`}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
            >
              {getOptionLabel(option)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
