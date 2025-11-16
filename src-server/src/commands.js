import { listen, once } from '/node-modules/@tauri-apps/api/event.js';
import { invoke } from '/node-modules/@tauri-apps/api/core.js';
//import { appWindow } from '/node-modules/@tauri-apps/api/window.js';
import { getCurrentWindow } from "/node-modules/@tauri-apps/api/window.js";

 
const INTERVAL = 1000;
const TIMERS = new Map();
const LISTENERS = new Map();
const STATES = new Map();
let APP = null;
let HTML = null;
let MODULE = null;
let DB_RESET = null;
let DB_CALL = null;
let DIV = null;


export const append = (query, tag, attrs = {}, dataset = {}) =>
  void Object.assign(DIV.querySelector(query).appendChild(Object.assign(document.createElement(tag), attrs)).dataset, dataset);

export const assign = (query, attrs = {}, dataset = {}) =>
  void Object.assign(Object.assign(DIV.querySelector(query), attrs).dataset, dataset); 

const fileCall = string => (data => data.forEach(([call, ...row]) => MODULE[call](...row)))(JSON.parse(string));

const dbCall = string => (({ args, data }) => data.forEach(([call, ...row]) => MODULE[call](args, ...row)))(JSON.parse(string));

export function sendDB(args, call, ...data) {
  const instance = new Date().valueOf().toString();
  const call_cmd = `db_${instance}_call`;
  const reset_cmd = `db_${instance}_reset`;

  // unlisten is never called...
  // use timer to call unlisten
  // after all events called, the unlisten event is called
  listen(call_cmd, e => dbCall(e.payload))
    .then(unlisten => LISTENERS.set(call_cmd, unlisten) );

  listen(reset_cmd, () => {
    LISTENERS.get(call_cmd)();
    LISTENERS.get(reset_cmd)();
  })
    .then(unlisten => LISTENERS.set(reset_cmd, unlisten) );

  invoke('send_db', { instance, msg: JSON.stringify({ call, args, data }) });
}

// ----------------------------------- RESET 

export function init(app, html, module) {
  APP = app;
  HTML = html;
  MODULE = module;
  DB_RESET = () => { };
  DB_CALL = () => { };
  DIV = document.querySelector('.root').appendChild(document.createElement('div'));
  DIV.className = `app ${app}`;
  DIV.id = app;
  reset();
}

export function reset() {
  // div and module only defined when APP initially null
  TIMERS.forEach(id => clearInterval(id));
  TIMERS.clear();
  LISTENERS.forEach(reset => reset() );
  LISTENERS.clear();
  STATES.clear();

  DB_RESET();
  DB_CALL();
  DIV.innerHTML = HTML;
}

// ----------------------------------- FILES 

export async function asyncRegisterFile(path, reset) {
  const call_cmd = `data_${pathToName(path)}_call`;
  const reset_cmd = `data_${pathToName(path)}_reset`;

  if (LISTENERS.has(call_cmd))
    return;

  console.log('file being registered')  
  LISTENERS.set(call_cmd, await listen(call_cmd, e => fileCall(e.payload)));
  LISTENERS.set(reset_cmd, await listen(reset_cmd, _ => reset()));
  fileCall(await invoke('read_file', { path: path }));
}

export function unregisterFile(filepath) {
  const call_cmd = `data_${pathToName(path)}_call`;
  const reset_cmd = `data_${pathToName(path)}_reset`;

  if (LISTENERS.has(call_cmd))
    return

  LISTENERS.get(call_cmd)();
  LISTENERS.delete(call_cmd);
  LISTENERS.get(reset_cmd)();
  LISTENERS.delete(reset_cmd);
}
 
// ----------------------------------- ACTIONS

export function registerAction(args, event) {
  event(args);
  TIMERS.set(event.name, setInterval(() => event(args), INTERVAL));
}

export function unregisterAction(event) {
  clearInterval(TIMERS.get(event.name));
  return TIMERS.delete(event.name);
}

// ----------------------------------- STATE

export function setState(key, value) {
  STATES.set(key, value);
}

export function useState(key) {
  return STATES.get(key);
}

// ----------------------------------- UTILS

export function pathToName(path) {
  // paths relative to src directory
  return path.replace('/', '_').replace('\\', '_');
}

export async function asyncIsFile(path) {
  return '1' === await invoke('is_file', { filename: path });
}


