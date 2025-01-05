import { useState, useRef, useEffect } from 'react';
import styles from './SingleSelect.module.css';

/**
 * Props for the SingleSelect component
 * @template T The type of the option values
 */
interface SingleSelectProps<T> {
  /** Array of available options */
  options: T[];
  /** Currently selected value */
  value: T;
  /** Callback when selection changes */
  onChange: (value: T) => void;
  /** Placeholder text when no option is selected */
  placeholder: string;
  /** Function to convert option value to display label */
  getLabel: (value: T) => string;
}

/**
 * A dropdown component that allows selecting a single option from a list
 * @template T The type of the option values
 */
export function SingleSelect<T>({ 
  options, 
  value, 
  onChange, 
  placeholder,
  getLabel 
}: SingleSelectProps<T>) {
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

  const handleSelect = (option: T) => {
    onChange(option);
    setIsOpen(false);
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
        {getLabel(value)}
      </button>

      {isOpen && (
        <div 
          className={styles.dropdown}
          role="listbox"
          aria-label={placeholder}
        >
          {options.map((option) => (
            <button
              key={String(option)}
              type="button"
              className={`${styles.option} ${option === value ? styles.selected : ''}`}
              onClick={() => handleSelect(option)}
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
