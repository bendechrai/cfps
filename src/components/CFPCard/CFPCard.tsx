import { createCFPId } from "../../utils/cfpStatus";
import styles from "./CFPCard.module.css";
import { formatDate } from "../../utils/dateUtils";
import { useCFP } from "../../contexts/CFPContext";
import { CFP } from "@/utils/types";

const WarningIcon = () => (
  <svg
    className={styles.warningIcon}
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#4a5568"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 8v5M12 16h0" />
    <path d="M12 2.5L2 19.5h20L12 2.5z" />
  </svg>
);

interface CFPCardProps {
  cfp: CFP;
  isClosingSoon: boolean;
}

export const CFPCard = ({ cfp, isClosingSoon }: CFPCardProps) => {
  const { cfpStatuses, updateCFPStatus } = useCFP();
  const status = cfpStatuses[createCFPId(cfp)]?.status;

  return (
    <article className={`${styles.card} ${status ? styles[status] : ""}`}>
      {isClosingSoon && (
        <div className={styles.closingSoonBanner}>
          <WarningIcon />
          <span>Closing soon!</span>
        </div>
      )}
      <h2 className={styles.cardTitle}>
        <a href={cfp.eventUrl} target="_blank" rel="noopener noreferrer">
          {cfp.name}
        </a>
      </h2>
      <div className={styles.cardMeta}>
        <p>Location: {cfp.location}</p>
        <p>CFP Closes: {formatDate(cfp.cfpEndDate)}</p>
        <p>Event Date: {formatDate(cfp.eventStartDate)}</p>
      </div>
      <div className={styles.cardActions}>
        <a
          href={cfp.cfpUrl}
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
