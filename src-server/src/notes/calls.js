import '/notes/components.js';
import * as util from '/utils.js';
import * as cmd from '/commands.js';


export function init(app, html, module) {
  cmd.init(app, html, module);
}

 

// reset must be synchronous

export function reset(date = null) {
  cmd.reset();
}
 

// ----------------------------------- ACTIONS
 
// ----------------------------------- DB CALLS

// ----------------------------------- FILE CALLS

// ----------------------------------- LOCAL

// -----------------------------------

 