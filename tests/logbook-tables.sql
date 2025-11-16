DROP TABLE logbook_event;
DROP TABLE logbook_signature;
DROP TABLE logbook_status;
DROP TABLE study_queue;
DROP TABLE logbook;
DROP TYPE ltm_status;
DROP TABLE technician;
DROP TABLE patient;

--  
CREATE TABLE patient (
    mrn BIGINT PRIMARY KEY,
    first_name VARCHAR(40) NOT NULL,
    last_name VARCHAR(40) NOT NULL
);

CREATE TABLE technician (
    tech BIGINT PRIMARY KEY NOT NULL,
    first_name VARCHAR(40) NOT NULL,
    last_name VARCHAR(40) NOT NULL,
    del BIGINT
);

CREATE TYPE ltm_status AS ENUM (
    'continuous active',
    'continuous complete',
    'intermittent active',
    'intermittent paused',
    'intermittent complete',
    'ambulatory active',
    'ambulatory complete',
    'unmonitored active',
    'unmonitored complete'
);

CREATE TABLE logbook (
    study BIGINT PRIMARY KEY,
    study_end BIGINT,
    mrn BIGINT REFERENCES patient NOT NULL,
    timer BIGINT NOT NULL CHECK (timer >= 0),
    status ltm_status NOT NULL,
    event_a TEXT,
    event_b TEXT,
    event_c TEXT,
    event_d TEXT,
    event_e TEXT,
    event_f TEXT,
    event_g TEXT,
    event_h TEXT,
    event_i TEXT,
    event_j TEXT,
    event_k TEXT,
    event_l TEXT,
    event_m TEXT,
    event_n TEXT,
    event_o TEXT,
    event_p TEXT,
    event_q TEXT,
    event_r TEXT,
    event_s TEXT,
    event_t TEXT,
    event_u TEXT,
    event_v TEXT,
    event_w TEXT,
    event_x TEXT,
    event_y TEXT,
    event_z TEXT
);

CREATE TABLE study_queue (
    queue BIGINT PRIMARY KEY,
    mrn BIGINT REFERENCES patient NOT NULL,
    logbook_study BIGINT REFERENCES logbook
);

CREATE TABLE logbook_signature (
    dt BIGINT PRIMARY KEY,
    study BIGINT REFERENCES logbook NOT NULL,
    tech BIGINT REFERENCES technician NOT NULL,
    timeslot BIGINT NOT NULL,
    eeg_integrity_quality BOOLEAN NOT NULL,
    video_integrity_quality BOOLEAN NOT NULL,
    needs_maintenance BOOLEAN NOT NULL
);

CREATE TABLE logbook_status (
    dt BIGINT PRIMARY KEY,
    study BIGINT REFERENCES logbook NOT NULL,
    status ltm_status NOT NULL
);

CREATE TABLE logbook_event (
    dt BIGINT PRIMARY KEY,
    study BIGINT REFERENCES logbook NOT NULL,
    event BIGINT NOT NULL CHECK (event >= 0)
);