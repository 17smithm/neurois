import utils
import os

 
MILLI = 1000 


def post_notes(cursor, send_files, args, row):
    """
        dt (int),
        note_name (str),
        note_text (str)
    """
    cursor.execute("INSERT INTO notes VALUES (%s, %s, %s, NULL);", row)
    send_files(
        'a',
        'notes',
        'post_notes',
        [row]
    )

def post_notes_text(cursor, send_files, args, row):
    """"
        dt (int),
        note_text (str)
    """
    cursor.execute("UPDATE notes SET note_text = %s WHERE dt = %s;", [row[1], row[0]])
    send_files(
        'a',
        'notes',
        'post_notes_text',
        [row]
    )

def del_notes(cursor, send_files, args, row):
    """
    row:
        del (int),
        dt (int),
    """
    cursor.execute("UPDATE notes SET del = %s WHERE dt = %s;", row)
    refresh_notes(cursor, send_files)

def refresh_notes(cursor, send_files):
    cursor.execute("SELECT dt, note_name, note_text FROM notes WHERE del IS NULL ORDER BY dt;")
    send_files('w', 'notes', 'post_notes', cursor.fetchall())

