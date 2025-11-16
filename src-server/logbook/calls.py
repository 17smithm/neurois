import utils
import os

 

ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

MILLI = 1000




# --------------------------------- LOGBOOK ---------------------------------

 

def logbook(cursor, send_files, args, row):

    """

        study (int),

    """

    cursor.execute("SELECT * FROM logbook WHERE study = %s;", row)

    return cursor.fetchall()

 

def post_logbook(cursor, send_files, args, row):

    """

        queue (int), # not in logbook!

       

        study (int),

        study_end (int),

        mrn (int),

        timer (int),

        status (str),

        event_a (str), # all events are optional

        ...

        event_z (str),

    """

    date = utils.get_date_from(row[1] // MILLI)  * MILLI

    timeslot = utils.get_timeslot_from(row[1] // MILLI) * MILLI

    prev_date_last_timeslot = utils.get_prev_timeslot_from(date // MILLI) * MILLI

    filepath = f'logbook/{date}'

    row_values = row[1:]

    row_values.extend([None for _ in range(32 - len(row))])

    cursor.execute("SELECT MAX (timeslot) FROM logbook_signature;")

    sign_timeslot = cursor.fetchone()[0]

   

    cursor.execute("INSERT INTO logbook VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);", row_values)

    cursor.execute("INSERT INTO logbook_status VALUES (%s, %s, %s);", (row[1], row[1], row[5]))

    cursor.execute("UPDATE study_queue SET logbook_study = %s WHERE queue = %s;", (row[1], row[0]))

    refresh_study_queue(cursor, send_files)

    send_files(

        'a',

        filepath,

        'post_logbook',

        [row_values]

    )

    send_files(

        'a',

        filepath,

        'post_logbook_status',

        [(row[1], row[1], row[5])]

    )

 

    # if no previous signatures

    #   if study date >= min unsigned date

    #       - post timeslot

    # if previous date is all signed

    #   - post timeslot

 

    if sign_timeslot is None:

        cursor.execute("SELECT MIN (study) FROM logbook;")

        min_study = cursor.fetchone()[0]

        min_study = min_study if min_study is not None else row[1]

        min_study_date = utils.get_date_from(min_study // MILLI) * MILLI

        # if date >= min unsigned date

        if date >= min_study_date:

            send_files(

                'a',

                filepath,

                'timeslot',

                [(timeslot, row[1])]

            )

    # if prev date is all signed

    elif prev_date_last_timeslot <= sign_timeslot and utils.is_timeslot_signed(cursor, prev_date_last_timeslot):

        send_files(

            'a',

            filepath,

            'timeslot',

            [(timeslot, row[1])]

        )

 

def logbook__active(cursor, send_files, args, row):

    """

        study_end (None),

    """

    cursor.execute("SELECT * FROM logbook WHERE study_end IS NULL ORDER BY study;")

    return [(row[0], row[2], row[3], row[4]) for row in cursor.fetchall()]

 

def post_logbook__event(cursor, send_files, args, row):

    """

        event (int),            zero-indexed int of letter of event

        event_{a, ...z} (str),  event description

        study (int),

    """

    if type(row[0]) is int:

        post = f'UPDATE logbook SET event_{  ALPHABET[row[0]] } = %s WHERE study = %s;'

        cursor.execute(post, row[1:])

        send_files('a', f'logbook/{utils.get_date() * MILLI}', 'post_logbook__event', [(*row[1:], row[0])])

 

def refresh_logbook(cursor, send_files) -> None:

 

    cursor.execute("SELECT MIN (study) FROM logbook;")

    min_study = cursor.fetchone()[0]

    if min_study is None:

        return open(f'data/logbook/{utils.get_date() * MILLI}', 'w').close()

 

    events = {}

    now_timeslot = utils.get_timeslot() * MILLI

    now_date = utils.get_date_from(now_timeslot // MILLI) * MILLI

    dates = utils.create_logbook_dates(min_study, now_date)

    events = utils.add_event_timeslot_keys(min_study, events, now_timeslot)

    max_timeslot = utils.get_max_timeslot(cursor, now_timeslot)

 

    cursor.execute("SELECT * FROM logbook ORDER BY study;")

    for row in cursor.fetchall():

 

        start_date = utils.get_date_from(row[0] // MILLI) * MILLI

        start_timeslot = utils.get_timeslot_from(row[0] // MILLI) * MILLI

        end_timeslot = now_timeslot if row[1] is None else utils.get_timeslot_from(row[1] // MILLI) * MILLI

        end_date = utils.get_date_from(end_timeslot // MILLI) * MILLI

        end_date = utils.get_next_date_from(end_date // MILLI) * MILLI

        end_date_timeslot = utils.get_prev_timeslot_from(end_date // MILLI) * MILLI

        end_date_timeslot = min(max_timeslot, end_date_timeslot)

 

        events = utils.add_event_dates(events, start_date, end_date, row)

        events = utils.add_event_statuses(cursor, events, start_timeslot, end_timeslot, row)

        events = utils.add_event_timeslots(events, start_timeslot, end_date_timeslot, row[0])

 

    for date in dates:

        filepath = f'logbook/{date}'

        next_date = utils.get_next_date_from(date // MILLI) * MILLI

 

        cursor.execute("SELECT * FROM logbook_signature WHERE timeslot BETWEEN %s AND %s ORDER BY timeslot;", (date, next_date))

        events = utils.map_dt_events(events, cursor.fetchall(), filepath, 'post_logbook_signature')

        cursor.execute("SELECT * FROM logbook_status WHERE dt BETWEEN %s AND %s ORDER BY dt;", (date, next_date))

        events = utils.map_dt_events(events, cursor.fetchall(), filepath, 'post_logbook_status')

        cursor.execute("SELECT * FROM logbook_event WHERE dt BETWEEN %s AND %s ORDER BY dt;", (date, next_date))

        events = utils.map_dt_events(events, cursor.fetchall(), filepath, 'post_logbook_event')

 

    for dt in sorted(events):

        for args in events[dt]:

            send_files(*args)

 

# --------------------------------- LOGBOOK EVENT ---------------------------------

 

def post_logbook_event(cursor, send_files, args, row):

    """

        dt (int),

        study (int),

        event (int),

    """

    cursor.execute("INSERT INTO logbook_event VALUES (%s, %s, %s);", row)

    send_files('a', f'logbook/{utils.get_date_from(row[0] // MILLI) * MILLI}', 'post_logbook_event', [row])

 

# --------------------------------- LOGBOOK SIGNATURE ---------------------------------

 

def post_logbook_signature(cursor, send_files, args, row):

    """

        dt (int) ms,

        study (int) ms,

        tech (int) ms,

        timeslot (int) ms,

        eeg_integrity_quality (bool),

        video_integrity_quality (bool),

        needs_maintenance (bool),

    """

    cursor.execute("INSERT INTO logbook_signature VALUES (%s, %s, %s, %s, %s, %s, %s);", row)

    timeslot = row[3]

    date = utils.get_date_from(timeslot // MILLI) * MILLI

    next_date = utils.get_next_date_from(date // MILLI) * MILLI

    date_end_timeslot = utils.get_prev_timeslot_from(next_date // MILLI) * MILLI

    send_files('a', f'logbook/{date}', 'post_logbook_signature', [row])

 

    cursor.execute("SELECT MAX (timeslot) FROM logbook_signature;")

    sign_timeslot = cursor.fetchone()[0]

    sign_timeslot = sign_timeslot if sign_timeslot is not None else timeslot

 

    # if timeslot == sign_timeslot

    # and timeslot is last timeslot of date

    # and timeslot is all signed

    #   - entire date gets filled when next_date isn't today

    #   - else date gets filled upto current_timeslot

 

    if timeslot == sign_timeslot and \
        timeslot == date_end_timeslot and \
        utils.is_timeslot_signed(cursor, timeslot):

 

        next_next_date = utils.get_next_date_from(next_date // MILLI) * MILLI

        next_date_last_timeslot = utils.get_prev_timeslot_from(next_next_date // MILLI) * MILLI

        max_timeslot = min(next_date_last_timeslot, utils.get_timeslot() * MILLI)

        send_files(

            'a',

            f'logbook/{next_date}',

            'timeslot',

            utils.collect_timeslots(cursor, next_date, max_timeslot)

        )

 

# --------------------------------- LOGBOOK STATUS ---------------------------------

 

def post_logbook_status(cursor, send_files, args, row):

    """

        dt (int),

        study (int),

        status (str)

    """

    cursor.execute("UPDATE logbook SET status = %s WHERE study = %s;", (row[2], row[1]))

    cursor.execute("INSERT INTO logbook_status VALUES (%s, %s, %s);", row)

    send_files(

        'a',

        f'logbook/{utils.get_date_from(row[0] // 1000)  * MILLI}',

        'post_logbook_status',

        [row]

    )

    if 'complete' == row[2].split(' ')[1]:

        cursor.execute("UPDATE logbook SET study_end = %s WHERE study = %s;", (row[0], row[1]))

def patient(cursor, send_files, args, row):

    """

    row:

        mrn (int),

    """

    cursor.execute("SELECT * FROM patient WHERE mrn = %s;", row)

    return cursor.fetchall()

 

def post_patient(cursor, send_files, args, row):

    """

    row:

        mrn (int),

        first_name (str),

        last_name (str),

    """

    cursor.execute("INSERT INTO patient VALUES (%s, %s, %s);", row)

 

# --------------------------------- TECHNICIAN ---------------------------------

 

def technician(cursor, send_files, args, row):

    """

    row:

        tech (int),

    """

    cursor.execute("SELECT * FROM technician WHERE tech = %s;", row)

    return cursor.fetchall()

 

def post_technician(cursor, send_files, args, row):

    """

    row:

        tech (int),

        first_name (str),

        last_name (str)

    """

    cursor.execute("INSERT INTO technician VALUES (%s, %s, %s, NULL) RETURNING *;", row)

    send_files('a', 'technicians', 'post_technician', cursor.fetchall())

 

def refresh_technician(cursor, send_files):

    cursor.execute("SELECT * FROM technician WHERE del IS NULL ORDER BY tech;")

    send_files('w', 'technicians', 'post_technician', cursor.fetchall())

 

def post_technician__del(cursor, send_files, args, row):

    """

    row:

        del (int),

        tech (int),

    """

    cursor.execute("UPDATE technician SET del = %s WHERE tech = %s;", row)

    refresh_technician(cursor, send_files)

 

# --------------------------------- STUDY QUEUE ---------------------------------

 

def post_study_queue(cursor, send_files, args, row):

    """

    row:

        queue (int) datetime arrived,

        mrn (int),

    """

    cursor.execute("INSERT INTO study_queue VALUES (%s, %s, NULL) RETURNING *;", row)

    send_files('a', 'study_queue', 'post_study_queue', cursor.fetchall())

 

def refresh_study_queue(cursor, send_files):

    cursor.execute("SELECT * FROM study_queue WHERE logbook_study IS NULL ORDER BY queue;")

    send_files('w', 'study_queue', 'post_study_queue', cursor.fetchall())