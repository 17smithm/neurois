from pathlib import Path

import json

import os

import time

 

import utils

 

MILLI = 1000

 

class Timer:

 

    def __init__(self, t):

        self.time = t

 

    def time_check(self, t):

        return t

   

    def start_interval(self, cursor, send_files):

        self.time += 1

        cursor.execute("SELECT * FROM logbook WHERE study_end IS NULL ORDER BY study;")

        for row in cursor.fetchall():

            if row[4].split(' ')[1] == 'active':

                cursor.execute("SELECT * FROM logbook_status WHERE study = %s ORDER BY dt;", (row[0], ))

                cursor.execute("UPDATE logbook SET timer = %s WHERE study = %s;", (utils.get_timer(cursor.fetchall(), self.time), row[0]))

 

class Date:

 

    def __init__(self, t):

        self.time = utils.get_date()

 

    def time_check(self, t):

        return utils.get_date_from(t)

 

    def start_interval(self, cursor, send_files):

        self.time = utils.get_next_date_from(self.time)

        cursor.execute("SELECT * FROM logbook WHERE study_end IS NULL ORDER BY study;")

        send_files('w', f'logbook/{self.time * MILLI}', 'post_logbook', cursor.fetchall())

 

class Timeslot:

 

    def __init__(self, t):

        self.time = utils.get_timeslot()

 

    def time_check(self, t):

        return utils.get_timeslot_from(t)

 

    def start_interval(self, cursor, send_files):

        prev_timeslot = self.time * MILLI

        new_timeslot = utils.get_next_timeslot_from(self.time) * MILLI

        new_time_date = utils.get_date_from(new_timeslot // MILLI) * MILLI

        filepath = f'logbook/{new_time_date}'

        self.time = new_timeslot // MILLI

 

        # post logbook_status event every new timeslot

        cursor.execute("SELECT * FROM logbook WHERE study_end IS NULL ORDER BY study;")

        send_files(

            'a',

            filepath,

            'post_logbook_status',

            [(new_timeslot, row[0], row[4]) for row in cursor.fetchall()]

        )

 

        # post timeslot event if prev timeslot is all signed

        if utils.is_timeslot_signed(cursor, prev_timeslot):

            send_files(

                'a',

                filepath,

                'timeslot',

                utils.collect_timeslots(cursor, new_time_date, new_timeslot)

            )