import utils
import calls
import os

 
MILLI = 1000 

def notes(cursor, send_files, args, row):
    """

    """
    cursor.execute("SELECT * FROM notes;")
    return cursor.fetchall()

def post_notes(cursor, send_files, args, row):
    """
        dt (int),
        note_name (str),
        note_text (str)
    """
    cursor.execute("INSERT INTO notes VALUES (%s, %s, %s);", row)
    send_files(
        'a',
        f'notes',
        'post_notes',
        [row]
    )

def refresh_notes(cursor, send_files):
    cursor.execute("SELECT * FROM notes ORDER BY dt;")
    send_files('w', 'notes', 'post_notes', cursor.fetchall())


