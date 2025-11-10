import * as utils from '/utils.js';




class Btn extends HTMLElement {

    connectedCallback() {

        this.addEventListener("click", this.onclick);

    }

 

    disconnectedCallback() {

        this.removeEventListener("click", this.onclick);

    }

}

 

class CheckboxBtn extends Btn {

    onclick(e) {

        this.classList.toggle('active');

    }

}

 

class ProgressBar extends HTMLElement {

    static timeslotSeconds = 7200 * 1000;

    static observedAttributes = ['data-dt', 'data-dt-end'];

 

    attributeChangedCallback(name, oldValue, newValue) {

        if (name === 'data-dt') {

            this.previousElementSibling.dataset.dtEnd = newValue;

        }

        else {

            this.style.setProperty('--inline-size', (newValue - this.dataset.dt) / ProgressBar.timeslotSeconds * 160 + 'px');

        }

    }

}

 

class ProgressMask extends HTMLElement {

    constructor() {

        super();

        this.dataset.dt = this.parentElement.dataset.timeslot;

 

        if (+this.dataset.dt > new Date().valueOf() - ProgressBar.timeslotSeconds) {

            this.style.setProperty('--inset-inline-start', utils.getProgress(Math.max(+this.dataset.dt, new Date().valueOf())));

        }

    }

}

 

class DragBtn extends Btn {

    onMove = e => {

        this.parentElement.style.width = window.innerWidth - e.clientX + 16 * (0.75 - 0.125) + 'px';

        document.body.style.cursor = 'ew-resize';

    }

    onUp = e => {

        removeEventListener('mousemove', this.onMove);

        removeEventListener('mouseup', this.onUp)

        document.body.style.cursor = 'default';

    }

    onclick(e) {

        addEventListener('mousemove', this.onMove)

        addEventListener('mouseup', this.onUp)

    }

}

 

customElements.define('ltm-progress-mask', ProgressMask);

customElements.define('ltm-progress-bar', ProgressBar);

customElements.define("ltm-drag-btn", DragBtn);

customElements.define('checkbox-btn', CheckboxBtn);