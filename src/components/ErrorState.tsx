import styles from "../app/cfps.module.css";

interface ErrorStateProps {
  message: string;
}

export const ErrorState = ({ message }: ErrorStateProps) => (
  <div className={styles.messageContainer}>
    <div className={styles.errorMessage}>{message}</div>
  </div>
);
