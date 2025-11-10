import os
import sys

MILLI = 1000
NEWLINE = b'\n'
TERMINATOR = b';'
# child directories of input PATH.
DIRS = (
    'apps',
    'data',
)

def main():
    PATH = os.path.normpath(sys.argv[1])

    # can fail if multiple substrings of dir in PATH.
    for dir in DIRS:
        for walk_path, walk_folders, walk_files in os.walk(os.path.join(PATH, dir)):
            mtimes = []
            path = walk_path[ walk_path.find(dir) : ]

            for file in walk_files:
                filepath = os.path.join(path, file)
                mtime = os.path.getmtime(filepath)
                mtimes.append(str(int(mtime * MILLI)))

            path = path.encode()
            folders = ','.join(walk_folders).encode()
            filenames = ','.join(walk_files).encode()
            mtimes = ','.join(mtimes).encode()
            path_len = len(path).to_bytes(1, 'big')
            folders_len = len(folders).to_bytes(4, 'big')
            filenames_len = len(filenames).to_bytes(4, 'big')
            mtimes_len = len(mtimes).to_bytes(4, 'big')

            msg = b''.join((path_len, folders_len, filenames_len, mtimes_len, path, folders, filenames, mtimes, NEWLINE))
            sys.stdout.buffer.write(msg)
    else:
        sys.stdout.buffer.write(TERMINATOR)

if __name__ == '__main__':
    main()