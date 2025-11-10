import utils

 

# --------------------------------- PATIENT ---------------------------------

 

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