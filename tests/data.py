import time
import datetime as dt
import json
import pathlib
import socket
import os
import json

PATH = 'c:\\users\\mrs029\\desktop\\neurois\\tests\\data'
DB_ADDRESS = ('localhost', '8001')
FILES_ADDRESS = ('localhost', '8002')

start_time = int(time.time()) * 1000

def get_date_from(t: int) -> int:
    dt_tuple = dt.datetime.fromtimestamp(t).timetuple()
    return int(time.mktime(time.struct_time((dt_tuple.tm_year, dt_tuple.tm_mon, dt_tuple.tm_mday, 0, 0, 0, dt_tuple.tm_wday, dt_tuple.tm_yday, -1))))

def get_prev_date_from(t: int) -> int:
    date = get_date_from(t)
    next_date = dt.datetime.fromtimestamp(date) - dt.timedelta(days=1.)
    return int(next_date.timestamp())

# start_time = get_prev_date_from(start_time // 1000) * 1000

DATA = (
    ['post_technician', 1706355865000, 'Jessica', 'Solaris'],
    ['post_technician', 1706355865000 + 1, 'Aaron', 'Howard-Miller'],

    ['post_patient', 1234, 'Michael', 'Smith'],
    ['post_patient', 1235, 'Tim', 'Held'],

    ["post_study_queue", start_time, 1234],
    ["post_study_queue", start_time + 1, 1235],
    ["post_study_queue", start_time + 2, 1234],
    ["post_study_queue", start_time + 3, 1235],
    ["post_study_queue", start_time + 4, 1234],
    ["post_study_queue", start_time + 5, 1235],

    ["post_logbook", start_time, start_time + 1, None, 1234, 0, "intermittent active", "Leg Tremor", "Heart ache"],
    ["post_logbook", start_time + 1, start_time + 2, None, 1235, 0, "ambulatory active", "Different Leg tremor"],
    ["post_logbook", start_time + 2, start_time + 3, None, 1234, 0, "unmonitored active"],
    ["post_logbook", start_time + 3, start_time + 4, None, 1235, 0, "continuous active", "Leg Tremor", "Heart ache"],

    ["post_logbook__event", 1, "event b overwrite", start_time + 1],
    ["post_logbook__event", 2, "event c write", start_time + 1],
 
    ["post_logbook_event", start_time + 1, start_time + 1, 1],
    ["post_logbook_event", start_time + 2, start_time + 1, 2],
)

def test_db() -> None:
    db_conn = socket.create_connection(DB_ADDRESS)

    for row in DATA:
        data_send = json.dumps({'args': {}, 'call': row[0], 'data': row[1:] }).encode()        
        data_send_len = len(data_send).to_bytes(8, 'big')
        db_conn.sendall(data_send_len + data_send)

        data_recv_len = int.from_bytes(db_conn.recv(8), 'big')
        if not data_recv_len:
            print('graceful data close...')
            db_conn.close()
            break
        data_recv = json.loads(db_conn.recv(data_recv_len).decode())
        print(data_recv_len, data_recv)

    db_conn.close()

def test_files():
    files_conn = socket.create_connection(FILES_ADDRESS)

    path = '/'.encode()
    path_len = len(path).to_bytes(1, 'big')
    folders_len = (0).to_bytes(4, 'big')
    files_len = (0).to_bytes(4, 'big')
    mtimes_len = (0).to_bytes(4, 'big')
    files_conn.send(path_len + folders_len + files_len + mtimes_len + path)

    while True:
        mode = files_conn.recv(1)
        if not mode:
            break
        mode = mode.decode()

        filepath_len = files_conn.recv(1)
        filepath_len = int.from_bytes(filepath_len, 'big')
        filepath = files_conn.recv(filepath_len).decode()

        if mode == 'f':
            os.mkdir(PATH + filepath)
        elif mode == 'r':
            os.rmdir(PATH + filepath)
        elif mode == 'd':
            os.remove(PATH + filepath)
        else:
            data_len = files_conn.recv(8)
            data_len = int.from_bytes(data_len, 'big')
            data = files_conn.recv(data_len)

            with open(PATH + filepath, mode + 'b') as f:
                f.write(data)

        print(mode, filepath)

    files_conn.close()

def get_date() -> int:
    return int(time.mktime(dt.date.today().timetuple()))

def get_date_from(t: int) -> int:
    dt_tuple = dt.datetime.fromtimestamp(t).timetuple()
    return int(time.mktime(time.struct_time((dt_tuple.tm_year, dt_tuple.tm_mon, dt_tuple.tm_mday, 0, 0, 0, dt_tuple.tm_wday, dt_tuple.tm_yday, -1))))

def get_timeslot_from(t: int) -> int:
    dt_tuple = dt.datetime.fromtimestamp(t).timetuple()
    return int(time.mktime(time.struct_time((dt_tuple.tm_year, dt_tuple.tm_mon, dt_tuple.tm_mday, dt_tuple.tm_hour // 2 * 2, 0, 0, dt_tuple.tm_wday, dt_tuple.tm_yday, -1))))


if __name__ == "__main__":
    test_db()
    # test_files()