import * as cmd from '/commands.js';
import { invoke } from '/modules/@tauri-apps/api/core.js';
import { listen, once } from '/modules/@tauri-apps/api/event.js';

 

listen('app_reset', e => {

  console.log('reloading ', e.payload);

  location.reload();

});

 

let APP_MENU_STATUS = true;

let ACTIVE = null;

const ACTIVE_APPS = new Map();

 

class AppMenuBtn extends HTMLElement {

 

  connectedCallback() {

    this.addEventListener("click", this.onclick);

  }

 

  disconnectedCallback() {

    this.removeEventListener("click", this.onclick);

  }

 

  onclick() {

    if (ACTIVE_APPS.length !== 0) {

      document.querySelector('.app-menu').classList.toggle('disabled');

    }

  }

}

 

class AppBtn extends HTMLElement {

 

  connectedCallback() {

    this.addEventListener("click", this.onclick);

  }

 

  disconnectedCallback() {

    this.removeEventListener("click", this.onclick);

  }

 

  onclick(_) {

    if (ACTIVE === this.dataset.app && APP_MENU_STATUS) {

      document.querySelector('#' + ACTIVE).classList.add('active');

      document.querySelector('.app-menu').classList.remove('disabled');

    }

    else if (!ACTIVE_APPS.has(this.dataset.app)) {      

      asyncInit(this.dataset.app, this.dataset.dir)

        .then(() =>  startApp(this.dataset.app));

    }

    else {

      startApp(this.dataset.app);

    }

  }

}

 

async function asyncInit(app, dir) {

  const module = await import( dir + 'calls.js');

  const html = await invoke('read_app', { app });

  ACTIVE_APPS.set(app, module);

  module.init(app, html, module);

}

 

function startApp(app) {

  ACTIVE_APPS.get(app).reset();

 

  if (ACTIVE === app) {

    return;

  }

  else if (ACTIVE !== null) {

    document.querySelector('#' + ACTIVE).classList.remove('active');

    document.querySelector('#' + app).classList.add('active');

  }

  document.querySelector('.app-menu').classList.add('disabled');

 

  ACTIVE = app;

  APP_MENU_STATUS = false;

}

 

customElements.define("app-btn", AppBtn);

customElements.define("app-menu-btn", AppMenuBtn);