import '/notes/components.js';
import * as util from '/utils.js';
import * as cmd from '/commands.js';
import { marked } from '/node-modules/marked/lib/marked.esm.js';


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
  cmd.append('.notes-sidebar', 'notes-file-btn', { className: 'btn notes-file-btn', textContent: name}, {dt, text});
}

export function post_notes_text(dt, text) {
  cmd.assign(`.notes-file-btn[data-dt="${dt}"]`, {}, {text});
}

// ----------------------------------- LOCAL

// -----------------------------------

 