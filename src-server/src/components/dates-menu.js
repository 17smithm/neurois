import * as util from '/utils.js';

import * as cmd from '/commands.js';

 

class DatesMenu extends HTMLElement {

  static months = {

    0: 'January',

    1: 'February',

    2: 'March',

    3: 'April',

    4: 'May',

    5: 'June',

    6: 'July',

    7: 'August',

    8: 'Sepetember',

    9: 'October',

    10: 'November',

    11: 'December'

  };

  static observedAttributes = ["data-date"];

 

  async attributeChangedCallback(name, oldValue, newValue) {

    const start = new Date(+newValue);

    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);

    start.setDate(1);

 

    this.querySelector('.dates-menu-head-item').textContent = `${DatesMenu.months[start.getMonth()]} ${start.getFullYear()}`;

    this.querySelector('.dates-menu-body').textContent = '';

 

    for (let i = start.getDay() - 1; i >= 0; i--) {

      this.querySelector('.dates-menu-body').appendChild(document.createElement('div')).className = 'dates-menu-body-item';

      this.querySelector('.dates-menu-body').lastElementChild.textContent = new Date(start.getFullYear(), start.getMonth(), 0).getDate() - i;

    }

 

    for (let i = 1; i <= end.getDate(); i++) {

      start.setDate(i);

      this.querySelector('.dates-menu-body').appendChild(document.createElement('dates-menu-body-item')).className = 'dates-menu-body-item';

      this.querySelector('.dates-menu-body').lastElementChild.textContent = i;

      if (await cmd.asyncIsFile(`logbook\\${start.valueOf()}`)) {

        this.querySelector('.dates-menu-body').lastElementChild.dataset.i = i;

        this.querySelector('.dates-menu-body').lastElementChild.dataset.date = start.valueOf();

        this.querySelector('.dates-menu-body').lastElementChild.classList.add('active');

      }

    }

 

    for (let i = 1; i < 7 - end.getDay(); i++) {

      this.querySelector('.dates-menu-body').appendChild(document.createElement('div')).className = 'dates-menu-body-item';

      this.querySelector('.dates-menu-body').lastElementChild.textContent = i;

    }

  }

}

 

class DatesMenuHeadBtn extends HTMLElement {

  connectedCallback() {

    this.addEventListener("click", this.onclick);

  }

  disconnectedCallback() {

    this.removeEventListener("click", this.onclick);

  }

  onclick(_) {

    const date = new Date(+this.parentElement.parentElement.dataset.date);

    date.setDate(14);

    if (this.dataset.arrow === 'left') {

      if (date.getMonth() - 1 < 0) {

        date.setYear(date.getFullYear() - 1);

        date.setMonth(11);

      } else {

        date.setMonth(date.getMonth() - 1);

      }

    } else {

      if (date.getMonth() + 1 > 11) {

        date.setYear(date.getFullYear() + 1);

        date.setMonth(0);

      } else {

        date.setMonth(date.getMonth() + 1)

      }

    }

    this.parentElement.parentElement.dataset.date = date.valueOf();

  }

}

customElements.define('dates-menu', DatesMenu);

customElements.define("dates-menu-head-btn", DatesMenuHeadBtn);