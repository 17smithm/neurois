import * as cmd from '/commands.js';

import * as util from '/utils.js';

import FloatHeadBtn from '/components/float-head-btn.js';

import MenuBtn from '/components/menu-btn.js';

 




class Btn extends HTMLElement {

  connectedCallback() {

    this.addEventListener("click", this.onclick);

  }

 

  disconnectedCallback() {

    this.removeEventListener("click", this.onclick);

  }

}

 

// ----------------------------------- BUTTONS




class DatesBtn extends FloatHeadBtn {

  openMenu() {

  }

  closeMenu() {

    this.parentElement.parentElement.lastElementChild.firstElementChild.dataset.date = this.previousElementSibling.dataset.date

  }

}

 

class TimerBtn extends Btn {

  static timerMap = {

    'active': 'paused',

    'paused': 'active',

  }

  static ltmMap = {

    'continuous': 'intermittent',

    'intermittent': 'intermittent',

  }

  async onclick() {

    cmd.sendDB({},

      'post_logbook_status',

      new Date().valueOf(),

      +this.parentElement.dataset.study,

      `${TimerBtn.ltmMap[this.dataset.statusLtm]} ${TimerBtn.timerMap[this.dataset.statusTimer]}`);

  }

}

 

class StartBtn extends MenuBtn {

  menuSelector = '.ltm-start-menu';

  on_click_event() {

    document.querySelector(this.menuSelector).parentElement.classList.add('active');

  }

  send() {

    cmd.sendDB({},

      'post_logbook',

      +this.previousElementSibling.dataset.arrival,

      new Date().valueOf(),

      null,

      +this.previousElementSibling.dataset.mrn,

      0,

      'continuous active'

    )

  }

}

 

// todo # 1 -----------------------

// make parent element observe data-slot instead

// change template in calls.js

 

class SignBtn extends MenuBtn {

  menuSelector = '.ltm-sign-menu';

  // data-timeslot can be 0-11

  // data-slot can be 1-12

  static observedAttributes = ['data-slot', 'data-timeslot-slot'];

  attributeChangedCallback(name, oldValue, newValue) {

    // slot set by logbook_signature event

    // timeslot-slot set by timeslot event

    if (name === 'data-slot') {

      this.parentElement.style.setProperty('--slot', newValue);

      if (this.dataset.timeslotSlot !== undefined && +newValue > +this.dataset.timeslotSlot) {

        this.classList.add('disabled');

      }

    } else {

      this.classList.remove('disabled');

    }

  }

  on_click_event() {

    // .dates-head-lbl dataset has data-date

    const timeslot = new Date(cmd.useState('date'));

    timeslot.setHours((this.dataset.slot ?? 0) * 2);

    // const timeslot =

    const study = +this.parentElement.parentElement.dataset.study;

    const tech = +document.querySelector('.ltm-techs-item:first-child').dataset.tech;

    const techName = document.querySelector('.ltm-techs-item:first-child').textContent;

    // slot can be undefined when no initial sign events

 

    document.querySelector('.ltm-sign-menu-btn').dataset.study = study;

    document.querySelector('.ltm-sign-menu-btn').dataset.tech = tech;

    document.querySelector('.ltm-sign-menu-btn').dataset.timeslot = timeslot.valueOf();

 

    cmd.assign('[data-name="ltm-sign-menu-timeslot"]', { }, { data: util.formatDatetime(timeslot) });

    document.querySelector('[data-name="ltm-sign-menu-name"]').dataset.data = document.querySelector(`.ltm-head[data-study="${study}"] > .ltm-name`).textContent;

    document.querySelector('[data-name="ltm-sign-menu-mrn"]').dataset.data = document.querySelector(`.ltm-head[data-study="${study}"] > .ltm-mrn`).textContent;

    document.querySelector('.ltm-sign-menu-eeg').classList.add('active');

    document.querySelector('.ltm-sign-menu-video').classList.add('active');

    document.querySelector('.ltm-sign-menu-maint').classList.remove('active');

 

    // .ltm-techs-menu getBoundingRectangleClient only works when .ltm-sign-menu-wrap is activated

    // so activate menu first then set width of ltm-techs-menu

    cmd.assign('.ltm-techs-head-lbl', { textContent: techName });

    document.querySelector(this.menuSelector).parentElement.classList.add('active');

    document.querySelector('.ltm-techs').style.setProperty('--width', document.querySelector('.ltm-techs-menu').getBoundingClientRect().width + 'px');

  }

}

 

class SignMenuBtn extends Btn {

  onclick(_) {

    cmd.sendDB({},

      'post_logbook_signature',

      new Date().valueOf(),

      +this.dataset.study,

      +this.dataset.tech, // tech here

      +this.dataset.timeslot,

      document.querySelector('.ltm-sign-menu-eeg').classList.contains('active'),

      document.querySelector('.ltm-sign-menu-video').classList.contains('active'),

      document.querySelector('.ltm-sign-menu-maint').classList.contains('active')

    );

    document.querySelector('.ltm-sign-menu').parentElement.classList.remove('active');

  }

}

 

class CompleteBtn extends Btn {

  onclick(_) {

    cmd.sendDB({},

      'post_logbook_status',

      new Date().valueOf(),

      +this.parentElement.dataset.study,

      `${this.dataset.statusLtm} complete`);

  }

}

 

class TablesBtn extends Btn {

  onclick(e) {

    if (!document.querySelector('.ltm-side').classList.toggle('active')) {

      document.querySelector('.ltm-side').style.width = '0px';

    }

  }

}

 

class ShowBtn extends Btn {

  onclick() {

    const active = this.classList.toggle('active');

    for (const e of document.querySelectorAll(`[data-study="${this.dataset.study}"]:not(.ltm-tbl-item)`)) {

      e.classList.toggle('hidden');

    }

    cmd.setState(+this.dataset.study, active);

    cmd.setState('columns', active ? cmd.useState('columns') + 1 : cmd.useState('columns') - 1);

    document.querySelector('.ltm-date').style.setProperty('--columns', cmd.useState('columns'));

  }

}

 

// ----------------------------------- ITEMS

 

class EventsItem extends Btn {

  async onclick(_) {

    document.querySelector('.root').click();

    cmd.sendDB({},

      'post_logbook_event',

      new Date().valueOf(),

      +this.parentElement.parentElement.parentElement.parentElement.dataset.study,

      +this.dataset.item);

  }

}

 

class TechsItem extends Btn {

  async onclick(e) {

    e.stopPropagation();

    document.querySelector('.root').click();

    document.querySelector('.ltm-techs-head-lbl').textContent = this.textContent;

    document.querySelector('.ltm-sign-menu-btn').dataset.tech = this.dataset.tech;

  }

}

 

customElements.define('ltm-dates-btn', DatesBtn);

customElements.define('ltm-sign-btn', SignBtn);

customElements.define('ltm-sign-menu-btn', SignMenuBtn);

customElements.define('ltm-timer-btn', TimerBtn);

customElements.define('ltm-complete-btn', CompleteBtn);

customElements.define('ltm-tables-btn', TablesBtn);

customElements.define('ltm-show-btn', ShowBtn);

customElements.define('ltm-start-btn', StartBtn);

 

customElements.define('ltm-events-item', EventsItem);

customElements.define('ltm-techs-item', TechsItem);