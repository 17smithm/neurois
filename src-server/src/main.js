// import { appWindow } from '/modules/@tauri-apps/api/window.js';
import { getCurrentWindow } from "/node-modules/@tauri-apps/api/window.js";
import { listen, once } from '/node-modules/@tauri-apps/api/event.js';

// app btns must await startup event
// rust files sync could conclude before startup listened ??

once('startup', () => {
  document.querySelectorAll('.app-btn').forEach(btn => btn.classList.add('disabled'));
  console.log('startup finished!');
})

export function main() {
  document.querySelector('.app-bar-apps').textContent = '';
  document.querySelector('.app-menu-apps').textContent = '';
  document.querySelector('.root').textContent = '';
  document.querySelector('.app-bar-apps').append(document.querySelector('#apps').content.cloneNode(true));
  document.querySelector('.app-menu-apps').append(document.querySelector('#apps').content.cloneNode(true));
};

document.getElementById('titlebar-minimize').addEventListener('click', getCurrentWindow().minimize);
document.getElementById('titlebar-maximize').addEventListener('click', getCurrentWindow().toggleMaximize);
document.getElementById('titlebar-close').addEventListener('click', getCurrentWindow().close);
document.addEventListener('DOMContentLoaded', main);

