import socket
import asyncio
import json
import multiprocessing as mp
import threading
from pathlib import Path
import time
import os
import shutil

import psycopg2

import utils
import timers
import files
import calls
from logbook import calls as logbook
from notes import calls as notes

DB_ADDRESS = "dbname='postgres' host='localhost' port='8000' user='postgres' password='n3ur01S'"
DIR = 'c:/users/mrs029/desktop/neurois/data'
PATH = Path(DIR)
MILLI = 1000
ADDRESS = ('localhost', 8001)

CALLS = {
    # global EW EW
    'patient': calls.patient,
    'post_patient': calls.post_patient,
    'technician': calls.technician,
    'post_technician': calls.post_technician,
    'post_technician__del': calls.post_technician__del,
    'post_study_queue': calls.post_study_queue,
    # logbook
    "logbook": logbook.logbook,
    'post_logbook': logbook.post_logbook,
    'post_logbook__event': logbook.post_logbook__event,
    'logbook__active': logbook.logbook__active,
    'post_logbook_signature': logbook.post_logbook_signature,
    'post_logbook_status': logbook.post_logbook_status,
    'post_logbook_event': logbook.post_logbook_event,
    # notes
    'notes': notes.notes,
    'post_notes': notes.post_notes,
}

# need to close all connections on restart
def handler(db, files_pipe, conn: socket.socket, addr: tuple):
    cursor = db.cursor()
    try:
        while True:
            data_len = conn.recv(8)
            if not data_len:
                print('db graceful exit')
                break

            data_len = int.from_bytes(data_len, 'big')
            data = conn.recv(data_len).decode()
            data = json.loads(data)
            if type(data) is int:
                print('received int in main handler: ', data)
                break

            # print('i\t', data_len, data['data'])
            data['data'] = CALLS[data['call']](
                cursor,
                files_pipe,
                data['args'],
                data['data'],
            )

            if data['data'] is not None:
                data['data'] = [ (data['call'], *row) for row in data['data'] ]

            data =  json.dumps(data).encode()
            data_len = len(data).to_bytes(8, 'big')
            conn.sendall(data_len + data)
            db.commit()
            # print('o\t', len(data))

    except MemoryError:
        pass
    except Exception as e:
        print('DB Connection Error:', e)
        db.rollback()
    finally:
        cursor.close()
        conn.shutdown(socket.SHUT_RDWR)
        conn.close()

def start_helpers():

    def send_files(mode: str, file: str, call: str, data: list[tuple]) -> None:
        file = os.path.normpath(file)
        file_path = os.path.join('data', file)
        send_files_pipe.send((
            mode,
            file_path,
            utils.format_data(call, data)
        ))

    recv_files, send_files_pipe = mp.Pipe(duplex=False)
    files_process = mp.Process(target=files.main, args=(recv_files, ))
    files_process.start()
    timer_process = mp.Process(target=timers.main, args=(send_files_pipe, ))
    timer_process.start()
    return send_files

def file_startup(cursor):

    def send_files(mode: str, file: str, call: str, data: list[tuple]):
        file = os.path.normpath(file)
        file_path = os.path.join('data', file)
        data_bytes = utils.format_data(call, data)
        with open(file_path, mode + 'b') as f:
            f.write(data_bytes)

    if not os.path.isdir('apps'):
        os.mkdir('apps')
    if os.path.isdir('data'):
        shutil.rmtree('data')

    os.mkdir('data')
    # fix me!! should happen auto and elsewhere
    os.mkdir('data/logbook')

    calls.refresh_study_queue(cursor, send_files)
    calls.refresh_technician(cursor, send_files)
    logbook.refresh_logbook(cursor, send_files)
    notes.refresh_notes(cursor, send_files)

def main():
    db = psycopg2.connect(DB_ADDRESS)
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.bind(ADDRESS)
    file_startup(db.cursor())
    send_files = start_helpers()

    while True:
        server.listen()
        conn, addr = server.accept()
        thread = threading.Thread(target=handler, args=(db, send_files, conn, addr))
        thread.start()

if __name__ == '__main__':
    main()