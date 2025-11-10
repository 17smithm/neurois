//import { invoke } from '/modules/@tauri-apps/api/core.js';

import * as util from '/utils.js';

// on press enter or leave textbox

//

 

// e.g. 0:0:0 -> 00:00:00

export default class TextboxBtn extends HTMLElement {

    static observedAttributes = ["data-data"];

    // must set initial dataset.data

    // methods:

    //   - validate_input

    //   - submit_input

 

    connectedCallback() {

        this.addEventListener('input', this.oninput);

        this.addEventListener('keydown', this.onkeydown);

        this.addEventListener('blur', this.onblur);

    }

    disconnectedCallback() {

        this.removeEventListener("input", this.oninput);

        this.removeEventListener('keydown', this.onkeydown);

        this.removeEventListener('blur', this.onblur);

    }

 

    attributeChangedCallback(name, oldValue, newValue) {

        this.textContent = newValue;

    }

 

    oninput(e) {

        const text = this.innerText.replaceAll(/\s/g, '');

        const valid_text = this.validate_input(text);

        const cursorPosition = window.getSelection().anchorOffset;

        this.dataset.data = valid_text;

 

        if (text.length > valid_text.length) {

            window.getSelection().collapse(this.firstChild, cursorPosition - 1);

        } else {

            window.getSelection().collapse(this.firstChild, cursorPosition);

        }

    }

 

    onkeydown(e) {

        if (e.key === 'Enter') {

            e.stopPropagation();

            this.blur();

        }

    }

 

    onblur(e) {

        this.blur();

        this.submit_input();

    }

}

 

class StartMenuTextboxTime extends TextboxBtn {

 

    validate_input(text) {

 

        if (this.dataset.data === undefined) {

            refreshTime(0, 0, 0);

            return '00:00:00';

        }

 

        let split = text.split(':');

        const [hour, minute, second] = split.map(field => field.length ? field : '0');

 

        if (split.length !== 3) {

            return this.dataset.data;

        }

        else if (isNaN(hour) || isNaN(minute) || isNaN(second)) {

            return this.dataset.data;

        }

        else if (+hour < 0 || +hour > 23) {

            return this.dataset.data;

        }

        else if (+minute < 0 || +minute > 59) {

            return this.dataset.data;

        }

        else if (+second < 0 || +second > 59) {

            return this.dataset.data;

        }

 

        refreshTimeData(+hour, +minute, +second)

        return `${util.stripDouble(hour)}:${util.stripDouble(minute)}:${util.stripDouble(second)}`;

    }

 

    submit_input() {

        this.dataset.data = util.formatTimeString(this.dataset.data);

    }

}

 

const pad = 12;

const clear_r = 7;

const x_0 = pad;

const x_1 = 58.75 + pad;

const x_2 = 117.5 + pad;

const x_list = [x_0, x_1, x_2];

 

function refreshTimeData(h, m, s) {

    document.querySelector('[data-name="ltm-start-menu-hour"]').dataset.data = h;

    document.querySelector('[data-name="ltm-start-menu-hour"]').style.setProperty('--slot', h);

    document.querySelector('[data-name="ltm-start-menu-minute"]').dataset.data = m;

    document.querySelector('[data-name="ltm-start-menu-minute"]').style.setProperty('--slot', m);

    document.querySelector('[data-name="ltm-start-menu-second"]').dataset.data = s;

    document.querySelector('[data-name="ltm-start-menu-second"]').style.setProperty('--slot', s);

}

 

function mapDomain(fraction) {

 

}

 

function refreshTimeCanvas(date) {

    // delete me

    if (!document.querySelector('.time-menu-canvas')) return;

 

    const ctx = document.querySelector('.time-menu-canvas').firstElementChild.getContext('2d');

 

    ctx.lineWidth = 2;

 

    const pathFrac = 20 * date.getMilliseconds() / 1000;

 

    // bad practice? maybe draw once and only translate

    ctx.save();

    ctx.clearRect(0, 0, x_2 + pad, 300 + pad * 2);

    ctx.restore();

 

    ctx.beginPath();

    ctx.moveTo(x_0, pad + 300 - date.getHours() * 300 / 24 - pathFrac);

    ctx.lineTo(x_1, pad + 300 - date.getMinutes() * 300 / 60 - pathFrac);

    ctx.lineTo(x_2, pad + 300 - date.getSeconds() * 300 / 60 - pathFrac);

    ctx.stroke();

    ctx.closePath();




    for (const [i, y_i] of [date.getHours(), date.getMinutes(), date.getSeconds()].entries()) {

        ctx.save();

        ctx.beginPath();

        ctx.arc(x_list[i], y_i, clear_r, 0, 2 * Math.PI, true);

        ctx.clip();

        ctx.clearRect(x_list[i] - clear_r, y_i - clear_r, clear_r * 2, clear_r * 2);

        ctx.restore();

    }






    // const sprite = await createImageBitmap(canvas);

    // ctx.drawImage(sprite, 0, 0);

}







requestAnimationFrame(t => animationFrame(t))

let prevT = null;

let interval = 16;

let frame = null;

let date = null;

 

function animationFrame(t) {

    if (prevT === null) prevT = t;

 

    if (t - prevT >= interval) {

        prevT = t;

        date = new Date();

        frame = requestAnimationFrame(t => animationFrame(t));

        refreshTimeCanvas(date);

    } else {

        setTimeout(

            () => { frame = requestAnimationFrame(t => animationFrame(t)) },

            interval - (t - prevT)

        );

        // console.log('sleep', (interval - (t - prevT)) | 0)

    }

}

 

function main() {

    setTimeout(main, 1000);

    if (!document.querySelector('[data-name="ltm-start-menu-hour"]')) return;

 

    // const [h, m, s] = document.querySelector('[data-name="ltm-start-menu-time"]').dataset.data.split(':').map(x => +x)

    document.querySelector('[data-name="ltm-start-menu-hour"]').style.setProperty('--slot', new Date().getHours());

    document.querySelector('[data-name="ltm-start-menu-minute"]').style.setProperty('--slot', new Date().getMinutes());

    document.querySelector('[data-name="ltm-start-menu-second"]').style.setProperty('--slot', new Date().getSeconds());

}

 

customElements.define('ltm-start-menu-textbox-time', StartMenuTextboxTime);

 

main()