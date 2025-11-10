export default class MenuBtn extends HTMLElement {

  /* properties:

      - menuSelector

  **/

  connectedCallback() {

    this.addEventListener("click", this.onclick);

  }

  disconnectedCallback() {

    this.removeEventListener("click", this.onclick);

  }

  onclick(e) {

    e.stopPropagation();

    document.querySelector('.root').click();

    document.querySelector(this.menuSelector).addEventListener('click', this.stop_propagation);

    document.querySelector('#logbook').addEventListener('click', () => {

      document.querySelector(this.menuSelector).parentElement.classList.remove('active');

      document.querySelector(this.menuSelector).removeEventListener('click', this.stop_propagation);

    }, { once: true });

    this.on_click_event();

  }

  stop_propagation(e) {

    e.stopPropagation();

    document.querySelector('.root').click();

  }

}