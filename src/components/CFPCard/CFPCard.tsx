import { CFP } from "../../utils/types";
import { CFPStatus } from "../../utils/cfpStatus";
import styles from "../../app/cfps.module.css";
import { formatDate } from "../../utils/dateUtils";

interface CFPCardProps {
  cfp: CFP;
  status: CFPStatus | undefined;
  isClosingSoon: boolean;
  onStatusChange: (status: CFPStatus | null) => void;
}

export const CFPCard = ({ cfp, status, isClosingSoon, onStatusChange }: CFPCardProps) => {
  return (
    <article
      className={`${styles.card} ${status ? styles[status] : ""} ${
        isClosingSoon ? styles.closingSoon : ""
      }`}
    >
      <h2 className={styles.cardTitle}>{cfp.conf.name}</h2>
      <div className={styles.cardMeta}>
        <p>Location: {cfp.conf.location}</p>
        <p>CFP Closes: {formatDate(cfp.untilDate)}</p>
        <p>Event Date: {formatDate(cfp.conf.date[0])}</p>
      </div>
      <div className={styles.cardActions}>
        <a
          href={cfp.link}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.cardLink}
        >
          Submit Proposal
        </a>
        <div className={styles.statusButtons}>
          <button
            className={`${styles.statusButton} ${
              status === "submitted" ? styles.active : ""
            }`}
            onClick={() =>
              onStatusChange(status === "submitted" ? null : "submitted")
            }
          >
            <span
              style={{
                color: status === "submitted" ? "#22c55e" : "currentColor",
              }}
            >
              ✓
            </span>
            {status === "submitted" ? "Unsubmit" : "Submitted"}
          </button>
          <button
            className={`${styles.statusButton} ${
              status === "ignored" ? styles.active : ""
            }`}
            onClick={() =>
              onStatusChange(status === "ignored" ? null : "ignored")
            }
          >
            <span
              style={{
                color: status === "ignored" ? "#ef4444" : "currentColor",
              }}
            >
              ✕
            </span>
            {status === "ignored" ? "Reinstate" : "Not Interested"}
          </button>
        </div>
      </div>
    </article>
  );
};
