import '/logbook/components.js';

import * as util from '/utils.js';

import * as cmd from '/commands.js';

import TextboxBtn from '/components/textbox-btn.js';

 

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

 

export function init(app, html, module) {

  cmd.init(app, html, module);

}

 

// reset must be synchronous

export function reset(date = null) {

  cmd.reset();

 

  const dt = new Date().valueOf();

  if (date === null)

    date = util.getDate(dt);

 

  cmd.setState('dt', dt);

  cmd.setState('date', date);

  cmd.setState('columns', 0);

 

  resetQueue();

  resetTechs();

  resetLogbook();

  asyncReset();

}

 

async function asyncReset(date = cmd.useState('date')) {

  await cmd.asyncRegisterFile('logbook/' + date.toString(), resetLogbook);

  await cmd.asyncRegisterFile('study_queue', resetQueue);

  await cmd.asyncRegisterFile('technicians', resetTechs);

  cmd.registerAction({}, () => cmd.sendDB({}, 'logbook__active'));

  if (date === util.getDate(cmd.useState('dt'))) {

    cmd.registerAction({}, maskProgress);

  }

}

 

function resetLogbook() {

  // cmd.useState('date') is valueOf and not string of date

  cmd.assign('.ltm-index-head .dates-menu', {}, { date: cmd.useState('date') });

  document.querySelector('[data-name="ltm-index-textbox-date"]').dataset.data = new Date(cmd.useState('date')).toLocaleDateString();

  cmd.assign('.ltm-index-head .dates-head-lbl', { textContent: new Date(cmd.useState('date')).toLocaleDateString() }, { date: cmd.useState('date') });

  cmd.assign('.ltm-head-wrap', { textContent: '' });

  cmd.assign('.ltm-body-wrap', { textContent: '' });

  cmd.assign('.ltm-log-wrap', { textContent: '' });

  cmd.assign('.ltm-foot-wrap', { textContent: '' });

  for (let i = 0; i < 12; i++) {

    cmd.assign(`.ltm-timeslot:nth-child(${i + 1})`, { textContent: '' }, { timeslot: util.getTimeslot(cmd.useState('date'), i) });

  }

  cmd.assign('.ltm-summary', { textContent: '' });

  cmd.assign('.ltm-machines', { textContent: '' });

}

 

function resetQueue() {

  cmd.assign('.ltm-queue', { textContent: '' });

}

 

function resetTechs() {

  cmd.assign('.ltm-techs-menu', { textContent: '' });

}

 

// ----------------------------------- ACTIONS

 

function maskProgress(_) {

  const now = new Date().valueOf();

  for (const e of document.querySelectorAll(`.ltm-progress[data-timeslot="${util.getTimeslot(cmd.useState('date'), util.getSlot(now))}"] > .ltm-progress-mask`)) {

    e.style.setProperty('--inset-inline-start', util.getProgress(now));

  }

}

 

// ----------------------------------- DB CALLS

 

export function patient({ study, arrival }, mrn, first, last) {

  // if event from logbook else event from study_queue

  if (study) {

    cmd.assign(`.ltm-head[data-study="${study}"] > .ltm-name`, { textContent: `${first} ${last}` });

    cmd.assign(`.ltm-tbl-name[data-study="${study}"]`, { textContent: `${first} ${last}` });

  } else {

    cmd.assign(`.ltm-tbl-name[data-arrival="${arrival}"]`, { textContent: `${first} ${last}` });

  }

}

 

export function technician({ study, timeslot }, tech, first, last) {

  cmd.assign(`.ltm-timeslot[data-timeslot="${timeslot}"] > [data-study="${study}"]`, { textContent: `${first} ${last}` });

}

 

export function logbook__active(_, study, mrn, timer, status) {

  cmd.sendDB({ study }, 'patient', mrn);

  cmd.assign(`.ltm-head[data-study="${study}"] > .ltm-timer`, { textContent: util.formatTimer(timer) });

  cmd.assign(`.ltm-tbl-timer[data-study="${study}"]`, { textContent: util.formatTimer(timer) });

  assignStatus(study, status);

}

 

export function logbook(_, study, study_end, mrn, timer, status) {

  logbook__active(_, study, mrn, timer, status);

  // only set complete status when post_logbook_status event is not present in date's events

  if (study_end !== null && util.getDate(study_end) !== cmd.useState('date')) {

    assignCompleteStatus(study_end, study, status);

  }

}

 

// ----------------------------------- FILE CALLS

 

export function post_technician(tech, first, last) {

  cmd.append('.ltm-techs-menu', 'ltm-techs-item', { className: 'float-menu-item ltm-techs-item', textContent: `${first} ${last}` }, { tech });

}

 

export function post_study_queue(arrival, mrn) {

  cmd.append('.ltm-queue', 'div', { className: 'ltm-tbl-item', textContent: mrn }, { arrival, mrn });

  cmd.append('.ltm-queue', 'div', { className: 'ltm-tbl-name ltm-tbl-item' }, { arrival, mrn });

  cmd.append('.ltm-queue', 'div', { className: 'ltm-tbl-arrival ltm-tbl-item', textContent: util.formatDatetime(arrival) }, { arrival, mrn });

  cmd.append('.ltm-queue', 'ltm-start-btn', { className: 'btn ltm-start-btn ltm-tbl-item', textContent: 'Start' }, { arrival, mrn });

  cmd.sendDB({ arrival }, 'patient', mrn);

}

 

export function post_logbook(study, study_end, mrn, timer, status, ...events) {

  cmd.setState(study, true);

  cmd.setState('columns', cmd.useState('columns') + 1);

  document.querySelector('.ltm-date').style.setProperty('--columns', cmd.useState('columns'));

  cmd.append('.ltm-head-wrap', 'div', { className: 'ltm-head', innerHTML: `<div class="ltm-timer">00:00:00</div><div class="ltm-name"></div><div class="ltm-mrn">${mrn}</div><ltm-timer-btn class="btn ltm-timer-btn"></ltm-timer-btn>` }, { study })

  cmd.append('.ltm-foot-wrap', 'div', { className: 'ltm-foot', innerHTML: '<div class="float"><div class="float-head"><ltm-events-btn class="btn blue float-head-lbl ltm-events-btn">Events</ltm-events-btn><float-head-btn class="btn blue float-head-btn"><svg class="float-head-btn-img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19z" /></svg></float-head-btn></div><div class="float-menu-wrap"><div class="float-menu up ltm-events-menu"><ltm-events-item data-item="0" class="float-menu-item ltm-events-item">A</ltm-events-item><ltm-events-item data-item="1" class="float-menu-item ltm-events-item">B</ltm-events-item><ltm-events-item data-item="2" class="float-menu-item ltm-events-item">C</ltm-events-item><ltm-events-item data-item="3" class="float-menu-item ltm-events-item">D</ltm-events-item><ltm-events-item data-item="4" class="float-menu-item ltm-events-item">E</ltm-events-item><ltm-events-item data-item="5" class="float-menu-item ltm-events-item">F</ltm-events-item><ltm-events-item data-item="6" class="float-menu-item ltm-events-item">G</ltm-events-item><ltm-events-item data-item="7" class="float-menu-item ltm-events-item">H</ltm-events-item><ltm-events-item data-item="8" class="float-menu-item ltm-events-item">I</ltm-events-item><ltm-events-item data-item="9" class="float-menu-item ltm-events-item">J</ltm-events-item><ltm-events-item data-item="10" class="float-menu-item ltm-events-item">K</ltm-events-item><ltm-events-item data-item="11" class="float-menu-item ltm-events-item">L</ltm-events-item><ltm-events-item data-item="12" class="float-menu-item ltm-events-item">M</ltm-events-item><ltm-events-item data-item="13" class="float-menu-item ltm-events-item">N</ltm-events-item><ltm-events-item data-item="14" class="float-menu-item ltm-events-item">O</ltm-events-item><ltm-events-item data-item="15" class="float-menu-item ltm-events-item">P</ltm-events-item><ltm-events-item data-item="16" class="float-menu-item ltm-events-item">Q</ltm-events-item><ltm-events-item data-item="17" class="float-menu-item ltm-events-item">R</ltm-events-item><ltm-events-item data-item="18" class="float-menu-item ltm-events-item">S</ltm-events-item><ltm-events-item data-item="19" class="float-menu-item ltm-events-item">T</ltm-events-item><ltm-events-item data-item="20" class="float-menu-item ltm-events-item">U</ltm-events-item><ltm-events-item data-item="21" class="float-menu-item ltm-events-item">V</ltm-events-item><ltm-events-item data-item="22" class="float-menu-item ltm-events-item">W</ltm-events-item><ltm-events-item data-item="23" class="float-menu-item ltm-events-item">X</ltm-events-item><ltm-events-item data-item="24" class="float-menu-item ltm-events-item">Y</ltm-events-item><ltm-events-item data-item="25" class="float-menu-item ltm-events-item">Z</ltm-events-item></div></div></div><ltm-complete-btn class="btn green disabled ltm-complete-btn">Complete</ltm-complete-btn>' }, { study });

  cmd.append('.ltm-log-wrap', 'div', { className: 'ltm-log' }, { study });

  cmd.append('.ltm-body-wrap', 'div', { className: 'ltm-body', innerHTML: `<div class="ltm-sign-btn-wrap"><ltm-sign-btn class="disabled btn ltm-sign-btn">Sign</ltm-sign-btn></div><div data-timeslot="${util.getTimeslot(cmd.useState('date'), 0)}" class="ltm-progress"><ltm-progress-mask class="ltm-progress-mask"></ltm-progress-mask></div><div data-timeslot="${util.getTimeslot(cmd.useState('date'), 1)}" class="ltm-progress"><ltm-progress-mask class="ltm-progress-mask"></ltm-progress-mask></div><div data-timeslot="${util.getTimeslot(cmd.useState('date'), 2)}" class="ltm-progress"><ltm-progress-mask class="ltm-progress-mask"></ltm-progress-mask></div><div data-timeslot="${util.getTimeslot(cmd.useState('date'), 3)}" class="ltm-progress"><ltm-progress-mask class="ltm-progress-mask"></ltm-progress-mask></div><div data-timeslot="${util.getTimeslot(cmd.useState('date'), 4)}" class="ltm-progress"><ltm-progress-mask class="ltm-progress-mask"></ltm-progress-mask></div><div data-timeslot="${util.getTimeslot(cmd.useState('date'), 5)}" class="ltm-progress"><ltm-progress-mask class="ltm-progress-mask"></ltm-progress-mask></div><div data-timeslot="${util.getTimeslot(cmd.useState('date'), 6)}" class="ltm-progress"><ltm-progress-mask class="ltm-progress-mask"></ltm-progress-mask></div><div data-timeslot="${util.getTimeslot(cmd.useState('date'), 7)}" class="ltm-progress"><ltm-progress-mask class="ltm-progress-mask"></ltm-progress-mask></div><div data-timeslot="${util.getTimeslot(cmd.useState('date'), 8)}" class="ltm-progress"><ltm-progress-mask class="ltm-progress-mask"></ltm-progress-mask></div><div data-timeslot="${util.getTimeslot(cmd.useState('date'), 9)}" class="ltm-progress"><ltm-progress-mask class="ltm-progress-mask"></ltm-progress-mask></div><div data-timeslot="${util.getTimeslot(cmd.useState('date'), 10)}" class="ltm-progress"><ltm-progress-mask class="ltm-progress-mask"></ltm-progress-mask></div><div data-timeslot="${util.getTimeslot(cmd.useState('date'), 11)}" class="ltm-progress"><ltm-progress-mask class="ltm-progress-mask"></ltm-progress-mask></div>` }, { study });

 

  cmd.append('.ltm-summary', 'div', { className: 'ltm-tbl-item', textContent: mrn }, { study });

  cmd.append('.ltm-summary', 'div', { className: 'ltm-tbl-name ltm-tbl-item' }, { study });

  cmd.append('.ltm-summary', 'div', { className: 'ltm-tbl-timer ltm-tbl-item' }, { study });

  cmd.append('.ltm-summary', 'ltm-show-btn', { className: 'btn ltm-show-btn ltm-tbl-item active' }, { study });

  // update mrn, timer, and status for previous dates of complete studies

  let timeslot;

  if (study >= cmd.useState('date')) {

    const slot = util.getSlot(study);

    timeslot = util.getTimeslot(cmd.useState('date'), slot);

    document.querySelector(`.ltm-body[data-study="${study}"] .ltm-sign-btn`).dataset.slot = slot;

  } else {

    timeslot = cmd.useState('date');

  }

  cmd.append(`.ltm-body[data-study="${study}"] > .ltm-progress[data-timeslot="${timeslot}"]`, 'ltm-progress-bar', { className: `ltm-progress-bar` }, { dt: timeslot });

  cmd.sendDB({}, 'logbook', study);

 

  for (const [i, description] of Object.entries(events)) {

    if (description === null) break;

    post_logbook__event(description, study, i);

  }

}

 

export function post_logbook_status(dt, study, status) {

  appendStatus(dt, study, status, util.getTimeslot(cmd.useState('date'), util.getSlot(dt)));

  assignStatus(study, status);

  if (status.includes('complete')) {

    assignCompleteStatus(dt, study, status);

  }

}

 

export function post_logbook_signature(dt, study, tech, timeslot, eeg, video, maintenance) {

  // enable complete btn when all timeslots signed

  if (timeslot === util.getTimeslot(dt)) {

    document.querySelector(`.ltm-foot[data-study="${study}"] > .ltm-complete-btn`).classList.remove('disabled');

  }

  document.querySelector(`.ltm-body[data-study="${study}"] .ltm-sign-btn`).dataset.slot = util.getSlot(timeslot) + 1;

  cmd.sendDB({ study, timeslot }, 'technician', tech);

}

 

export function post_logbook_event(dt, study, i) {

  cmd.append(`.ltm-log[data-study="${study}"]`, 'div', { className: 'ltm-log-item', textContent: util.formatTime(dt) }, { event: ALPHABET.at(i) });

}

 

export function post_logbook__event(description, study, i) {

  cmd.assign(`.ltm-foot[data-study="${study}"] [data-item="${i}"]`, {}, { description });

}

 

export function timeslot(timeslot, study) {

  cmd.append(`.ltm-timeslot[data-timeslot="${timeslot}"]`, 'div', { className: 'ltm-sign' }, { study });

  document.querySelector(`.ltm-body[data-study="${study}"] .ltm-sign-btn`).dataset.timeslotSlot = util.getSlot(timeslot);

  document.querySelector(`.ltm-foot[data-study="${study}"] > .ltm-complete-btn`).classList.add('disabled');

}

 

// ----------------------------------- LOCAL

 

function appendStatus(dt, study, status, timeslot) {

  cmd.append(`.ltm-body[data-study="${study}"] > .ltm-progress[data-timeslot="${timeslot}"]`, 'ltm-progress-bar', { className: `ltm-progress-bar ${status}` }, { dt });

}

 

function assignStatus(study, status) {

  const [statusLtm, statusTimer] = status.split(' ');

  cmd.assign(`.ltm-head[data-study="${study}"] > .ltm-timer-btn`, {}, { statusLtm, statusTimer });

  cmd.assign(`.ltm-foot[data-study="${study}"] > .ltm-complete-btn`, {}, { statusLtm, statusTimer });

  if (statusLtm === 'ambulatory' || statusLtm === 'unmonitored') {

    disableButtons(study);

  }

}

 

function assignCompleteStatus(dt, study, status) {

  disableButtons(study);

  for (let i = util.getSlot(dt); i < 12; i++) {

    document.querySelector(`.ltm-body[data-study="${study}"] > .ltm-progress[data-timeslot="${util.getTimeslot(util.getDate(dt), i)}"] > .ltm-progress-mask`).classList.add('complete');

    appendStatus(dt, study, status, util.getTimeslot(util.getDate(dt), i));

  }

}

 

function disableButtons(study) {

  document.querySelector(`.ltm-body[data-study="${study}"] > .ltm-sign-btn-wrap`).classList.add('disabled');

  document.querySelector(`.ltm-head[data-study="${study}"] > .ltm-timer-btn`).classList.add('disabled');

  document.querySelector(`.ltm-foot[data-study="${study}"] > .ltm-complete-btn`).classList.add('disabled');

  document.querySelector(`.ltm-foot[data-study="${study}"] .ltm-events-btn`).classList.add('disabled');

  document.querySelector(`.ltm-foot[data-study="${study}"] .float-head-btn`).classList.add('disabled');

}

 

// -----------------------------------

 

class DatesMenuBodyItem extends HTMLElement {

    connectedCallback() {

        this.addEventListener("click", this.onclick);

    }

    disconnectedCallback() {

        this.removeEventListener("click", this.onclick);

    }

    onclick() {

        reset(+this.dataset.date);

    }

}

 

class IndexTextboxDate extends TextboxBtn {

 

    validate_input(text) {

        if (this.dataset.data === undefined) {

            return new Date().toLocaleDateString();

        }

 

        // day: 1-31, month: 1-12

        // date.day: 1-31, date.month: 0-11

        const oldSplit = this.dataset.data.split('/');

        const split = text.split('/');

        const [month, day, year] = split.map((field, i) => field.length ? field : oldSplit.at(i));

 

        if (split.length !== 3) {

            return this.dataset.data;

        }

        else if (isNaN(day) || isNaN(month) || isNaN(year)) {

            return this.dataset.data;

        }

        else if (+year <= 1970 || +year > 3000) {

            return this.dataset.data;

        }

        else if (+month < 1 || +month > 12) {

            return this.dataset.data;

        }

        else if (+day < 1 || +day > util.getMaxDay(+month - 1, +year)) {

            return this.dataset.data;

        }

        else {

            return `${util.stripDouble(month)}/${util.stripDouble(day)}/${year}`;

        }

    }

 

    async submit_input() {

        const [month, day, year] = this.dataset.data.split('/').map(field => +field);

        const date = new Date(year, month - 1, day);

 

        if (await cmd.asyncIsFile(`logbook\\${date.valueOf()}`)) {

            this.dataset.data = date.toLocaleDateString();

            reset(date.valueOf());

        }

        else {

            this.dataset.data = new Date(+this.dataset.date).toLocaleDateString();

        }

    }

}

 

customElements.define('ltm-index-textbox-date', IndexTextboxDate);

customElements.define("dates-menu-body-item", DatesMenuBodyItem);