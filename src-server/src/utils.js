const BAR_WIDTH = 160;

 

export function getDate(datetime = new Date().valueOf()) {

  const dt = new Date(+datetime);

  dt.setHours(0);

  dt.setMinutes(0);

  dt.setSeconds(0);

  dt.setMilliseconds(0);

  return dt.valueOf();

}

 

export function getTimeslot(date, slot) {

  const dt = new Date(+date);

  dt.setHours(+slot * 2);

  return dt.valueOf();

}

 

export function getSlot(datetime = new Date().valueOf()) {

  const dt = new Date(+datetime);

  return Math.floor((dt.getHours() * 3600 + dt.getMinutes() * 60 + dt.getSeconds()) / 7200);

}

 

export function getProgress(datetime) {

  const dt = new Date(+datetime);

  return (dt.getHours() * 3600 + dt.getMinutes() * 60 + dt.getSeconds()) / 7200 * BAR_WIDTH % BAR_WIDTH + 'px';

}

 

export function formatTimer(seconds) {

  return (seconds / 3600 | 0) + new Date((seconds - (seconds / 3600 | 0) * 3600) * 1000).toTimeString().slice(2, 9);

}

 

export function formatTime(datetime) {

  return new Date(datetime).toTimeString().slice(0, 9);

}

 

export function formatDatetime(datetime) {

  return `${new Date(datetime).toLocaleDateString()} ${formatTime(datetime)}`;

}

 

export function formatSlot(slot) {

  // slot: string

  if (slot >= 5) {

    return `${slot * 2}:00:00`

  } else {

    return `0${slot * 2}:00:00`

  }

}

 

export function getMaxDay(month, year) {

  if (month === 11) {

      return new Date(year + 1, 0, 0).getDate();

  } else {

      return new Date(year, month + 1, 0).getDate();

  }

}

 

export function stripDouble(numString) {

  // '1' -> '1'

  // '01' -> '01'

  // '011' -> '11'

  // '123' -> '23'

  return numString.length > 2 ? getTail(numString, 2) : numString;

}

 

export function getTail(string, length) {

  return string.slice(string.length - length, string.length);

}

 

export function formatTimeString(timeString) {

  // '0:1:10' -> '00:01:10'

  return timeString.split(':').map(field => field.length > 1 ? getTail(field, 2) : '0' + field ).join(':');

}