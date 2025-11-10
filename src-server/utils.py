import time

import datetime as dt

from pathlib import Path

import json

import os

 

MILLI = 1000

 

def format_data(call: str, data: str) -> bytes:

    data_bytes = b'\n'.join((json.dumps((call, *row)).encode() for row in data))

    return data_bytes + b'\n' if data_bytes else b''

 

def get_timer(data, t: int) -> int:

    timer = 0

    for i, row in enumerate(data):

        if row[2].split(' ')[1] == 'paused':

            timer += row[0] - data[i - 1][0]

    return  t + (timer - data[len(data) - 1][0]) // MILLI

 

def get_date() -> int:

    return int(time.mktime(dt.date.today().timetuple()))

 

def get_date_from(t: int) -> int:

    dt_tuple = dt.datetime.fromtimestamp(t).timetuple()

    return int(time.mktime(time.struct_time((dt_tuple.tm_year, dt_tuple.tm_mon, dt_tuple.tm_mday, 0, 0, 0, dt_tuple.tm_wday, dt_tuple.tm_yday, -1))))

 

def get_timeslot() -> int:

    return get_timeslot_from(int(time.time()))

 

def get_timeslot_from(t: int) -> int:

    dt_tuple = dt.datetime.fromtimestamp(t).timetuple()

    return int(time.mktime(time.struct_time((dt_tuple.tm_year, dt_tuple.tm_mon, dt_tuple.tm_mday, dt_tuple.tm_hour // 2 * 2, 0, 0, dt_tuple.tm_wday, dt_tuple.tm_yday, -1))))

 

def get_next_date_from(t: int) -> int:

    date = get_date_from(t)

    next_date = dt.datetime.fromtimestamp(date) + dt.timedelta(days=1.)

    return int(next_date.timestamp())

 

def get_next_timeslot_from(t: int) -> int:

    timeslot = get_timeslot_from(t)

    next_timeslot = dt.datetime.fromtimestamp(timeslot) + dt.timedelta(hours=2.)

    return int(next_timeslot.timestamp())

 

def get_prev_timeslot_from(t: int) -> int:

    timeslot = get_timeslot_from(t)

    prev_timeslot = dt.datetime.fromtimestamp(timeslot) - dt.timedelta(hours=2.)

    return int(prev_timeslot.timestamp())

 

def get_timeslots(t: int) -> list[int]:

    last_timeslot = get_timeslot()

    timeslot = get_date_from(t)

    timeslots = []

    for i in range(12):

        next_timeslot = get_next_timeslot_from(timeslot)

        if next_timeslot < last_timeslot:

            timeslots.append(timeslot)

        else:

            break

        timeslot = next_timeslot

 

def get_last_date() -> int:

    dates = os.listdir('data/logbook')

    return int(max(dates)) // MILLI

 

def get_timeslot_status_studies(filename: str, timeslot: int) -> set:

    timeslot_status_studies = set()

    with open('data/' + filename, 'rb') as f:

        data = f.read()

        for row in data.split(b'\n'):

            values = json.loads(row)

            if values[0] == 'post_logbook_status' and values[1] == timeslot:

                timeslot_status_studies.add(values[2])

    return timeslot_status_studies

 

def get_last_timeslot() -> int:

    last_timeslot = get_last_date() * MILLI

    with open(f'data/logbook/{last_timeslot}') as f:

        for row in f.readlines():

            values = json.loads(row)

            if values[0] == 'timeslot':

                last_timeslot = values[1]

    return last_timeslot // MILLI

 

# -------------------------------- LOGBOOK

 

def create_logbook_dates(min_study: int, now_date: int) -> list:

    dates = []

    date_iter = get_date_from(min_study // MILLI) * MILLI

    while date_iter <= now_date:

        open(f'data/logbook/{date_iter}', 'w').close()

        dates.append(date_iter)

        date_iter = get_next_date_from(date_iter // MILLI) * MILLI

    return dates

 

def map_dt_events(events: dict, data: list, filepath: str, call: str) -> dict:

    for row in data:

        if row[0] in events:

            events[row[0]].append(('a', filepath, call, [row]))

        else:

            events[row[0]] = [('a', filepath, call, [row])]

    return events

 

def add_event_timeslot_keys(min_study: int, events: object, now_timeslot: int) -> object:

    # set timeslot_iter to first timeslot of first date.

    timeslot_iter = get_date_from(min_study // MILLI) * MILLI

    while timeslot_iter <= now_timeslot:

        events[timeslot_iter] = []

        timeslot_iter = get_next_timeslot_from(timeslot_iter // MILLI) * MILLI

    return events    

 

def add_event_dates(events: dict, date: int, end_date: int, row: tuple) -> dict:

    while date < end_date:

        events[date].append((

            'a',

            f'logbook/{date}',

            'post_logbook',

            [row]

        ))

        date = get_next_date_from(date // MILLI) * MILLI

    return events

 

def add_event_statuses(cursor, events: dict, timeslot: int, end_timeslot: int, row: tuple) -> dict:

    # post status for each timeslot until study_end is not null

    # skip first study timeslot

    timeslot = get_next_timeslot_from(timeslot // MILLI) * MILLI

    while timeslot <= end_timeslot:

        file_date = get_date_from(timeslot // MILLI) * MILLI

        cursor.execute("SELECT MAX (dt) FROM logbook_status WHERE dt <= %s AND study = %s;", (timeslot, row[0]))

        cursor.execute("SELECT * FROM logbook_status WHERE dt = %s;", (cursor.fetchone()[0], ))

        status_row = cursor.fetchone()

        status = status_row[2] if status_row is not None else row[4]

        events[timeslot].append((

            'a',

            f'logbook/{file_date}',

            'post_logbook_status',

            [(timeslot, row[0], status)]

        ))

        timeslot = get_next_timeslot_from(timeslot // MILLI) * MILLI

    return events

 

def add_event_timeslots(events: dict, timeslot: int, end_timeslot: int, study: int) -> dict:

    while timeslot <= end_timeslot:

        file_date = get_date_from(timeslot // MILLI) * MILLI

        events[timeslot].append((

            'a',

            f'logbook/{file_date}',

            'timeslot',

            [(timeslot, study)]

        ))

        timeslot = get_next_timeslot_from(timeslot // MILLI) * MILLI

    return events

 

def get_studies(cursor, timeslot: int, last_timeslot: int = None) -> list[tuple]:

    if last_timeslot is None:

        last_timeslot = get_next_timeslot_from(timeslot // MILLI) * MILLI

    studies = []

    cursor.execute("SELECT * FROM logbook WHERE study_end >= %s AND study_end < %s ORDER BY study;", (timeslot, last_timeslot))

    studies.extend(cursor.fetchall())

    cursor.execute("SELECT * FROM logbook WHERE study_end IS NULL AND study < %s ORDER BY study;", (last_timeslot, ))

    studies.extend(cursor.fetchall())

    return studies

 

def collect_timeslots(cursor, timeslot: int, last_timeslot: int) -> list[tuple]:

    # aggregates get_studies for each timeslot btwn timeslot and last_timeslot.

    # maps studies for timeslot event.

    date_studies = []

    start_timeslot = timeslot

    while timeslot <= last_timeslot:

        timeslot = get_next_timeslot_from(timeslot // MILLI) * MILLI

        date_studies.extend(

            [(timeslot, row[0]) for row in get_studies(cursor, start_timeslot, timeslot)]

        )

    return date_studies

 

def is_timeslot_signed(cursor, timeslot: int) -> bool | None:

    cursor.execute("SELECT * FROM logbook_signature WHERE timeslot = %s;", (timeslot, ))    

    signed_studies = [sign_row[1] for sign_row in cursor.fetchall()]

    if not len(signed_studies):

        if len(get_studies(cursor, timeslot)):

            return False

        return None

 

    for study_row in get_studies(cursor, timeslot):

        ltm_status = study_row[4].split(' ')[0]

        if ltm_status not in ('ambulatory', 'unmonitored'):

            if study_row[0] not in signed_studies:

                return False

    return True

 

def get_min_study(cursor) -> int | None:

    cursor.execute("SELECT MIN (study) FROM logbook;")

    return cursor.fetchone()[0]

 

def get_max_timeslot(cursor, now_timeslot: int) -> int:

    #

    cursor.execute("SELECT MAX (timeslot) FROM logbook_signature;")

    sign_data = cursor.fetchone()[0]

    sign_timeslot = sign_data if sign_data is not None else get_min_study(cursor)

    next_date = get_date_from(sign_timeslot // MILLI) * MILLI

    next_date = get_next_date_from(next_date // MILLI) * MILLI

    max_timeslot = get_prev_timeslot_from(next_date // MILLI) * MILLI

    if sign_data is None:

        # returns last timeslot of min study date

        # fails if no studies in logbook

        return min(max_timeslot, now_timeslot)

 

    if is_timeslot_signed(cursor, max_timeslot):

        print('signed: ', max_timeslot)

        max_timeslot = get_next_timeslot_from(max_timeslot // MILLI) * MILLI

        max_timeslot = get_next_date_from(next_date // MILLI) * MILLI

        max_timeslot = get_prev_timeslot_from(max_timeslot // MILLI) * MILLI

 

    return min(max_timeslot, now_timeslot)