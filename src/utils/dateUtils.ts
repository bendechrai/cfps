export const formatDate = (timestamp: number) => {
  // Create a UTC date from the timestamp
  const date = new Date(timestamp);
  
  // Convert to local date considering timezone offset
  const localDate = new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );

  return localDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
