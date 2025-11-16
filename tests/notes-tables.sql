DROP TABLE notes;

-- 

CREATE TABLE notes (
    dt BIGINT PRIMARY KEY,
    note_name TEXT,
    note_text TEXT
);

INSERT INTO notes VALUES (1762664400000, 'psychology notes', 'text here');
INSERT INTO notes VALUES (1762750800000, 'physics notes', '# nice header');
