import socket
import asyncio
import json
import multiprocessing as mp
import threading
import pathlib
import time
import logging
import socket
import os

ADDRESS = ('localhost', 8002)
# APP_PATHS = (
#     '/',
#     '/logbook',
# )
# DATA_PATH = 'data'
# SRC_PATH = 'src'
MILLI = 1000
TERMINATOR = b';'
DIRS = {
    'apps',
    'data',
}
FILE_CHECK_INTERVAL = 1 # seconds
FILE_HASH_INTERVAL = 10 # seconds

# ADDRS - key: addr, value: Address(conn, addr)
ADDRS = {}

# FILES - key: path, value: File(path, type)
FILES = {}

# SRC_FILES - key: path, value: mtime
SRC_FILES = {}
APPS = {} 

def writer(recv_files) -> None:
    while True:
        # mode: (string) a or w
        # file_path (string): path to file
        mode, file_path, data = recv_files.recv()
        if not file_path.startswith('data' + os.path.sep):
            print('attempted write on non-data path')
            return
        with open(file_path, mode + 'b') as f:
            f.write(data)

        # check if file not added to FILES ?
        FILES[file_path].last_mtime = FILES[file_path].mtime
        broadcast(mode, file_path, data)

class App:

    def __init__(self, name):
        self.name = name
        self.template_path = os.path.join('apps', name + '.html')
        self.prev_template_mtime = self.template_mtime
        self.src_path = os.path.join('src', name)
        self.src_files = get_child_files(self.src_path)   

    @property
    def template_mtime(self):
        return os.path.getmtime(self.src_)

    # @property
    # def mtime(self):

class Address: 

    def __init__(self, conn: socket.socket, addr: tuple) -> None:
        self.conn = conn
        self.conn_lock = mp.Lock()
        self.addr = addr

    def send_msg_stub(self, mode: str, path: str):
        with self.conn_lock:
            self.conn.sendall(b''.join((
            mode.encode(),
            len(path).to_bytes(8, 'big'),
            path.encode(),
        )))

    def send_msg(self, mode: str, path: str, data: bytes) -> None:
        with self.conn_lock:
            self.conn.sendall(b''.join((
                mode.encode(),
                len(path).to_bytes(8, 'big'),
                path.encode(),
                len(data).to_bytes(8, 'big'),
                data
            )))        

class File:

    def __init__(self, file_path: str) -> None:
        self.file_path = file_path # doesn't include leading sep
        self.last_mtime = self.mtime

    @property
    def data(self):
        with open(self.file_path, 'rb') as f:
            data = f.read()
        return data

    @property
    def mtime(self):
        return os.path.getmtime(self.file_path)        

def broadcast(mode, file_path, data):
    for addr in ADDRS.values():        
        addr.send_msg(mode, file_path, data)

def manager():
    # hash intervals
    while not time.sleep(FILE_CHECK_INTERVAL):
        check_new_files()
        check_mod_files()
        check_new_src_files()
        check_mod_src_files()

def handler(conn, addr):
    address = Address(conn, addr)
    ADDRS[addr] = address
    # try:
    while True:
        path_len = conn.recv(1)
        if not path_len:
            raise EOFError
        elif path_len == TERMINATOR:
            break
        path_len = int.from_bytes(path_len, 'big')
        folders_len = int.from_bytes(conn.recv(4), 'big')
        files_len = int.from_bytes(conn.recv(4), 'big')
        mtimes_len = int.from_bytes(conn.recv(4), 'big')
        path = conn.recv(path_len).decode()
        path = os.path.normpath(path)
        folders = conn.recv(folders_len).decode().split(',') if folders_len else ()
        filenames = conn.recv(files_len).decode().split(',') if files_len else ()
        mtimes = conn.recv(mtimes_len).decode().split(',') if mtimes_len else ()
        mtimes = [int(mtime) for mtime in mtimes]
        handle_folders(address, path, folders)
        handle_files(address, path, filenames, mtimes)

    address.send_msg_stub('0', '0')

    # literally just pauses thread to do nothing...
    while True:
        try:
            data = conn.recv(1)
            if not data:
                break
        except ConnectionResetError:
            break
        
    del ADDRS[addr]
    conn.shutdown(socket.SHUT_RDWR)
    conn.close()

def handle_folders(address, path, folders):
    folders = set(folders)

    for folder in get_child_folders(path) - folders:
        folder_path = os.path.join(path, folder)
        # create folder
        address.send_msg_stub('f', folder_path)
        # send child files and folders. then recurse child folders
        _, child_folders, child_files = next(os.walk(folder_path), (None, (), ()))
        child_mtimes = [0 for _ in range(len(child_files))]
        handle_files(address, folder_path, child_files, child_mtimes)
        handle_folders(address, folder_path, child_folders)

    for folder in folders - get_child_folders(path):
        folder_path = os.path.join(path, folder)
        # remove folder
        address.send_msg_stub('r', folder_path)

def handle_files(address: Address, path: list, files: list, mtimes: list[int]) -> None:
    print('handling files:', path, files)
    for i, file in enumerate(files):
        file_path = os.path.join(path, file)
        if file_path not in FILES:
            address.send_msg_stub('d', file_path)
        elif mtimes[i] < FILES[file_path].mtime:
            data = FILES[file_path].data
            address.send_msg('w', file_path, data)

    for file in get_child_files(path) - set(files):
        file_path = os.path.join(path, file)
        data = FILES[file_path].data
        address.send_msg('w', file_path, data)

def check_new_files(startup: bool = False) -> None:
    for dir in DIRS:
        for walk_path, _, walk_files in os.walk(dir):
            path = walk_path[ walk_path.find(dir) : ]
            for file in walk_files:
                file_path = os.path.join(path, file)
                if file_path in FILES:
                    continue
                FILES[file_path] = File(file_path) # could send mtime before w
                print('new', file_path)
                if not startup:
                    data = FILES[file_path].data
                    broadcast('w', file_path, data)

def check_mod_files() -> None:
    for file in FILES.values():
        if file.last_mtime < file.mtime:
            file.last_mtime = file.mtime
            print('mod', file.file_path)
            broadcast('w', file.file_path, file.data)

def check_new_src_files(startup: bool = False) -> None:
    pass

def check_mod_src_files() -> None:
    pass

def get_child_files(path: str) -> set():
    return set(next(os.walk(path), (None, None, ()))[2])

def get_child_folders(path: str) -> set():
    return set(next(os.walk(path), (None, (), None))[1])

def main(recv_files):
    check_new_files(True)
    writer_thread = threading.Thread(target=writer, args=(recv_files, ))
    manager_thread = threading.Thread(target=manager)

    # hasher_thread =
    writer_thread.start()
    manager_thread.start()
   
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.bind(ADDRESS)

    while True:
        server.listen()
        conn, addr = server.accept()
        thread = threading.Thread(target=handler, args=(conn, addr))
        thread.start()

if __name__ == '__main__':
    pass