export default class FloatHeadBtn extends HTMLElement {

  /* actions:

      - closeMenu

      - openMenu

  **/

  connectedCallback() {

    this.addEventListener("click", this.onclick);

  }

  disconnectedCallback() {

    this.removeEventListener("click", this.onclick);

  }

  onclick(e) {

    // float head btn clicked.

    //    - set active

    //    - add listener to app

    //    - add listener to menu to stop ^

    // any child can trigger click on this to deactivate menu

 

    if (this.parentElement.parentElement.lastElementChild.firstElementChild.classList.toggle('active')) {

      this.parentElement.parentElement.addEventListener('click', stopPropagation);

      document.querySelector('.root').addEventListener('click', end_e => {

        this.parentElement.parentElement.lastElementChild.firstElementChild.classList.remove('active');

        this.parentElement.parentElement.lastElementChild.firstElementChild.removeEventListener('click', stopPropagation);

        end_e.stopPropagation();

        if (this.closeMenu) {

          this.closeMenu();

        }

      }, { once: true });

      // prevent this click event from triggering the new #logbook listener

      e.stopPropagation();

      if (this.openMenu) {

        this.openMenu();

      }

    }

  }

}

 

function stopPropagation(e) {

  e.stopPropagation();

}

 

customElements.define('float-head-btn', FloatHeadBtn);