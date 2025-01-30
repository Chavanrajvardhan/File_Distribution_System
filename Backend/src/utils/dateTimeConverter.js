export function convertToIndianTime(isoDate) {
    // Check if isoDate is valid
    if (!isoDate) return null; // Return null for invalid or missing dates
    const date = new Date(isoDate);
 
    // Check if the Date object is valid
    if (isNaN(date.getTime())) {
      return null; // Return null for invalid date strings
    }
    // Convert the Date object to IST (Indian Standard Time)
    const indiaTime = date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    return indiaTime;
  }
 
 
