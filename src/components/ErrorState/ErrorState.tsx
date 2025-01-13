import styles from "./ErrorState.module.css";

interface ErrorStateProps {
  message: string;
}

export const ErrorState = ({ message }: ErrorStateProps) => (
  <div className={styles.messageContainer}>
    <div className={styles.errorMessage}>{message}</div>
  </div>
);
