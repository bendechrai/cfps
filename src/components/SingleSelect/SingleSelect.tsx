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
  selected: T | undefined;
  /** Callback when selection changes */
  onChange: (value: T) => void;
  /** Function to convert option value to display label */
  getOptionLabel: (option: T) => string;
  /** Placeholder text to show when no value is selected */
  placeholder?: string;
}

/**
 * A dropdown component that allows selecting a single option from a list
 * @template T The type of the option values
 */
export function SingleSelect<T>({ 
  options, 
  selected, 
  onChange,
  getOptionLabel,
  placeholder = "Loading..." 
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
      <div 
        className={`${styles.trigger} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected !== undefined ? getOptionLabel(selected) : placeholder}
        <span className={styles.arrow}>▼</span>
      </div>

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
