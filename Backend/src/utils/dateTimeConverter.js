export function convertToIndianTime(isoDate) {
    // Create a new Date object from the ISO datetime string
    const date = new Date(isoDate);

    // Convert the Date object to IST (Indian Standard Time)
    const indiaTime = date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    return indiaTime;
}


