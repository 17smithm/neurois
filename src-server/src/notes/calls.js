import '/notes/components.js';
import * as util from '/utils.js';
import * as cmd from '/commands.js';
import { marked } from '/modules/marked/lib/marked.esm.js';


export function init(app, html, module) {
  cmd.init(app, html, module);
}

// ----------------------------------- RESET

export function reset(date = null) {
  cmd.reset();
  asyncReset();
}

async function asyncReset() {
  await cmd.asyncRegisterFile('notes', resetNotes);
}
 
function resetNotes() {
  // reset notes list
}

// ----------------------------------- ACTIONS
 
// ----------------------------------- DB CALLS

// when cmd.sendDB() called, response calls functions here


// ----------------------------------- FILE CALLS

export function post_notes(dt, name, text) {
  cmd.append('.notes-sidebar', 'notes-file', { className: 'notes-file', textContent: name}, {dt, text});
}

// ----------------------------------- LOCAL

// -----------------------------------

 