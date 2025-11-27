/**
 * Date Helper Utilities
 *
 * Common date manipulation and formatting functions
 */

/**
 * Get start of day (00:00:00)
 * @param {Date} date
 * @returns {Date}
 */
function getStartOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day (23:59:59.999)
 * @param {Date} date
 * @returns {Date}
 */
function getEndOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get start of month
 * @param {Date} date
 * @returns {Date}
 */
function getStartOfMonth(date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of month
 * @param {Date} date
 * @returns {Date}
 */
function getEndOfMonth(date) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get start of week (Monday)
 * @param {Date} date
 * @returns {Date}
 */
function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of week (Sunday)
 * @param {Date} date
 * @returns {Date}
 */
function getEndOfWeek(date) {
  const d = getStartOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get start of year
 * @param {Date} date
 * @returns {Date}
 */
function getStartOfYear(date) {
  const d = new Date(date);
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of year
 * @param {Date} date
 * @returns {Date}
 */
function getEndOfYear(date) {
  const d = new Date(date);
  d.setMonth(11, 31);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Format date to string
 * @param {Date} date
 * @param {string} format - 'YYYY-MM-DD', 'DD/MM/YYYY', 'HH:mm', etc.
 * @returns {string}
 */
function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return '';

  const d = new Date(date);

  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  const formats = {
    'YYYY-MM-DD': `${year}-${month}-${day}`,
    'DD/MM/YYYY': `${day}/${month}/${year}`,
    'MM/DD/YYYY': `${month}/${day}/${year}`,
    'YYYY/MM/DD': `${year}/${month}/${day}`,
    'HH:mm': `${hours}:${minutes}`,
    'HH:mm:ss': `${hours}:${minutes}:${seconds}`,
    'YYYY-MM-DD HH:mm': `${year}-${month}-${day} ${hours}:${minutes}`,
    'YYYY-MM-DD HH:mm:ss': `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`,
    'DD MMM YYYY': `${day} ${getMonthName(d.getMonth())} ${year}`,
    'MMM DD, YYYY': `${getMonthName(d.getMonth())} ${day}, ${year}`,
  };

  return formats[format] || formats['YYYY-MM-DD'];
}

/**
 * Get month name
 * @param {number} monthIndex - 0-11
 * @returns {string}
 */
function getMonthName(monthIndex, short = true) {
  const months = {
    full: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  };

  return short ? months.short[monthIndex] : months.full[monthIndex];
}

/**
 * Get day name
 * @param {number} dayIndex - 0-6 (0 = Sunday)
 * @returns {string}
 */
function getDayName(dayIndex, short = true) {
  const days = {
    full: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  };

  return short ? days.short[dayIndex] : days.full[dayIndex];
}

/**
 * Add days to date
 * @param {Date} date
 * @param {number} days
 * @returns {Date}
 */
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Add months to date
 * @param {Date} date
 * @param {number} months
 * @returns {Date}
 */
function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * Add years to date
 * @param {Date} date
 * @param {number} years
 * @returns {Date}
 */
function addYears(date, years) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

/**
 * Calculate difference in days between two dates
 * @param {Date} date1
 * @param {Date} date2
 * @returns {number}
 */
function diffInDays(date1, date2) {
  const d1 = getStartOfDay(new Date(date1));
  const d2 = getStartOfDay(new Date(date2));
  const diff = Math.abs(d2 - d1);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calculate difference in hours between two dates
 * @param {Date} date1
 * @param {Date} date2
 * @returns {number}
 */
function diffInHours(date1, date2) {
  const diff = Math.abs(new Date(date2) - new Date(date1));
  return parseFloat((diff / (1000 * 60 * 60)).toFixed(2));
}

/**
 * Calculate difference in minutes between two dates
 * @param {Date} date1
 * @param {Date} date2
 * @returns {number}
 */
function diffInMinutes(date1, date2) {
  const diff = Math.abs(new Date(date2) - new Date(date1));
  return Math.floor(diff / (1000 * 60));
}

/**
 * Get business days between two dates (excluding weekends)
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {Array<number>} weeklyOffs - Array of day indices (0 = Sunday, 6 = Saturday)
 * @returns {number}
 */
function getBusinessDays(startDate, endDate, weeklyOffs = [0, 6]) {
  let count = 0;
  const start = getStartOfDay(new Date(startDate));
  const end = getStartOfDay(new Date(endDate));
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (!weeklyOffs.includes(dayOfWeek)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Get array of dates between start and end
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Array<Date>}
 */
function getDateRange(startDate, endDate) {
  const dates = [];
  const start = getStartOfDay(new Date(startDate));
  const end = getStartOfDay(new Date(endDate));
  const current = new Date(start);

  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Check if date is weekend
 * @param {Date} date
 * @param {Array<number>} weeklyOffs - Array of day indices
 * @returns {boolean}
 */
function isWeekend(date, weeklyOffs = [0, 6]) {
  const dayOfWeek = new Date(date).getDay();
  return weeklyOffs.includes(dayOfWeek);
}

/**
 * Check if date is today
 * @param {Date} date
 * @returns {boolean}
 */
function isToday(date) {
  const d = getStartOfDay(new Date(date));
  const today = getStartOfDay(new Date());
  return d.getTime() === today.getTime();
}

/**
 * Check if date is in past
 * @param {Date} date
 * @returns {boolean}
 */
function isPast(date) {
  const d = getStartOfDay(new Date(date));
  const today = getStartOfDay(new Date());
  return d < today;
}

/**
 * Check if date is in future
 * @param {Date} date
 * @returns {boolean}
 */
function isFuture(date) {
  const d = getStartOfDay(new Date(date));
  const today = getStartOfDay(new Date());
  return d > today;
}

/**
 * Check if date is between two dates (inclusive)
 * @param {Date} date
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {boolean}
 */
function isBetween(date, startDate, endDate) {
  const d = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  return d >= start && d <= end;
}

/**
 * Get current timestamp
 * @returns {number}
 */
function getCurrentTimestamp() {
  return Date.now();
}

/**
 * Parse date string to Date object
 * @param {string} dateString
 * @returns {Date|null}
 */
function parseDate(dateString) {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Check if valid date
 * @param {any} date
 * @returns {boolean}
 */
function isValidDate(date) {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
}

/**
 * Get age from date of birth
 * @param {Date} dateOfBirth
 * @returns {number}
 */
function getAge(dateOfBirth) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

/**
 * Get time ago string (e.g., "2 hours ago", "3 days ago")
 * @param {Date} date
 * @returns {string}
 */
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [name, secondsInInterval] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInInterval);
    if (interval >= 1) {
      return interval === 1 ? `1 ${name} ago` : `${interval} ${name}s ago`;
    }
  }

  return 'just now';
}

/**
 * Get fiscal year dates
 * @param {Date} date
 * @param {number} fiscalYearStartMonth - 0-11 (0 = January)
 * @returns {Object} { start: Date, end: Date }
 */
function getFiscalYear(date = new Date(), fiscalYearStartMonth = 3) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth();

  let fiscalYearStart;
  if (month >= fiscalYearStartMonth) {
    fiscalYearStart = new Date(year, fiscalYearStartMonth, 1);
  } else {
    fiscalYearStart = new Date(year - 1, fiscalYearStartMonth, 1);
  }

  const fiscalYearEnd = new Date(fiscalYearStart);
  fiscalYearEnd.setFullYear(fiscalYearEnd.getFullYear() + 1);
  fiscalYearEnd.setDate(fiscalYearEnd.getDate() - 1);
  fiscalYearEnd.setHours(23, 59, 59, 999);

  return {
    start: fiscalYearStart,
    end: fiscalYearEnd,
  };
}

/**
 * Convert time string (HH:mm) to minutes since midnight
 * @param {string} timeString - e.g., "09:30"
 * @returns {number}
 */
function timeToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string (HH:mm)
 * @param {number} minutes
 * @returns {string}
 */
function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

module.exports = {
  getStartOfDay,
  getEndOfDay,
  getStartOfMonth,
  getEndOfMonth,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfYear,
  getEndOfYear,
  formatDate,
  getMonthName,
  getDayName,
  addDays,
  addMonths,
  addYears,
  diffInDays,
  diffInHours,
  diffInMinutes,
  getBusinessDays,
  getDateRange,
  isWeekend,
  isToday,
  isPast,
  isFuture,
  isBetween,
  getCurrentTimestamp,
  parseDate,
  isValidDate,
  getAge,
  getTimeAgo,
  getFiscalYear,
  timeToMinutes,
  minutesToTime,
};
