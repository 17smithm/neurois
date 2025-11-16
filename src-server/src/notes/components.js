import * as cmd from '/commands.js';
import * as util from '/utils.js';
import { marked } from '/modules/marked/lib/marked.esm.js';


class NotesInput extends HTMLTextAreaElement {
  connectedCallback() {
    this.addEventListener("input", this.oninput);
  }

  disconnectedCallback() {
    this.removeEventListener("input", this.oninput);
  }

  oninput(_) {
    const parsedText = marked.parse(this.value);
    document.querySelector('.notes-output-container').innerHTML = parsedText;
  }
}

class Btn extends HTMLElement {
  connectedCallback() {
    this.addEventListener("click", this.onclick);
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.onclick);
  }
}

class NotesFile extends Btn {
  onclick() {
    document.querySelector('.notes-input').textContent = this.dataset.text;
    document.querySelector('.notes-output-container').innerHTML = marked.parse(this.dataset.text);
  }

}

customElements.define('notes-file', NotesFile);
customElements.define('notes-input', NotesInput, { extends: "textarea" });

