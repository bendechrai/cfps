import styles from "./LoadingState.module.css";

export const LoadingState = () => (
  <div className={styles.messageContainer}>
    <div className={styles.loadingMessage}>
      <span className={styles.loadingEmoji}>🚜</span>
      Loading CFPs...
    </div>
  </div>
);
