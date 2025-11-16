import * as cmd from '/commands.js';
import * as util from '/utils.js';
import { marked } from '/node-modules/marked/lib/marked.esm.js';


class NotesInput extends HTMLTextAreaElement {
  connectedCallback() {
    this.addEventListener("input", this.oninput);
  }

  disconnectedCallback() {
    this.removeEventListener("input", this.oninput);
  }

  oninput(_) {
    const parsedText = marked.parse(this.value);
    // 
    // 
    // MUST SANITIZE TEXT
    document.querySelector('.notes-output').innerHTML = parsedText;
    // 
    // 
  }
}


class NotesFileBtn extends HTMLElement {
  connectedCallback() {
    this.addEventListener("click", this.onclick);
  }
  disconnectedCallback() {
    this.removeEventListener("click", this.onclick);
  }
  onclick(_) {
    // console.log(this.dataset.text)

    if (this.parentElement.querySelector('.active.notes-file-btn') !== null) {
      cmd.sendDB(
        {},
        'post_notes_text',
        this.parentElement.querySelector('.active.notes-file-btn').dataset.dt,
        document.querySelector('.notes-input').value,
      );

      this.parentElement.querySelector('.active.notes-file-btn').classList.remove('active');
    }

    document.querySelector('.notes-input').value = this.dataset.text;
    document.querySelector('.notes-output').innerHTML = marked.parse(this.dataset.text);
    this.classList.add('active');
  }
}


//     document.body.style.cursor = 'ew-resize';
class DragBtn extends HTMLElement {
  connectedCallback() {
    this.addEventListener("mousedown", this.onmousedown);
  }
  disconnectedCallback() {
    this.removeEventListener("mousedown", this.onmousedown);
  }
  onmousemove = e => {
    const left = document.querySelector('.notes-containers').getBoundingClientRect().x
    const middle = e.x
    console.log(left, middle)
    document.querySelector('.notes-input-container').style.flexBasis = middle - left + 'px';
  }
  onmouseup = e => {
    removeEventListener('mousemove', this.onmousemove);
    document.body.style.cursor = 'default';
  }
  onmousedown(_) {
    addEventListener('mousemove', this.onmousemove);
    addEventListener('mouseup', this.onmouseup, {once: true});
  }
}

class NotesAddBtn extends HTMLElement {
  connectedCallback() {
    this.addEventListener("click", this.onclick);
  }
  disconnectedCallback() {
    this.removeEventListener("click", this.onclick);
  }
  onclick(e) {
    cmd.append('.notes-sidebar', 'notes-file-btn-new', { className: 'notes-file-btn notes-file-btn-new', contentEditable: 'true'}, {});
    e.stopPropagation();
  }
}


// section for deleted notes
// instant del, no confirmation
// autosave btn
// manual save btn
// prompt if want to save when exit

class NotesFileBtnNew extends HTMLElement {
  connectedCallback() {
    this.focus();
    this.addEventListener('keydown', this.onkeydown);
    this.addEventListener("focusout", this.onfocusout);
  }
  disconnectedCallback() {
    this.removeEventListener('keydown', this.onkeydown);
    this.removeEventListener('focusout', this.onfocusout);
  }
  onfocusout(_) {
    this.remove();
  }
  onkeydown(e) {
    // 
    // ------------ MAKE SURE TO SANTIZE TEXT BEFORE SENDING!!
    // 
    if (e.key !== 'Enter' && this.textContent) {
      cmd.sendDB(
        {},
        'post_notes',
        new Date().valueOf(),
        this.textContent,
        ''
      );
      this.remove();
    }
  }
}

customElements.define('notes-file-btn-new', NotesFileBtnNew);
customElements.define('notes-add-btn', NotesAddBtn);
customElements.define('notes-drag-btn', DragBtn);
customElements.define('notes-file-btn', NotesFileBtn);
customElements.define('notes-input', NotesInput, { extends: "textarea" });

