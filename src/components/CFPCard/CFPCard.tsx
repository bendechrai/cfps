import { CFP } from "../../utils/types";
import { createCFPId } from "../../utils/cfpStatus";
import styles from "./CFPCard.module.css";
import { formatDate } from "../../utils/dateUtils";
import { useCFP } from "../../contexts/CFPContext";

interface CFPCardProps {
  cfp: CFP;
  isClosingSoon: boolean;
}

export const CFPCard = ({ cfp, isClosingSoon }: CFPCardProps) => {
  const { cfpStatuses, updateCFPStatus } = useCFP();
  const status = cfpStatuses[createCFPId(cfp)]?.status;

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
              updateCFPStatus(
                createCFPId(cfp),
                status === "submitted" ? null : "submitted"
              )
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
              updateCFPStatus(
                createCFPId(cfp),
                status === "ignored" ? null : "ignored"
              )
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
