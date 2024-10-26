import "./style.css";

class Selektt {
  readonly #select: HTMLSelectElement;
  readonly #wrapper: HTMLDivElement;

  readonly #field: HTMLDivElement;

  readonly #dropdown: HTMLDivElement;
  readonly #input: HTMLInputElement;
  readonly #listbox: HTMLUListElement;
  readonly #id: string;

  #search: string = "";
  #highlighted: number = -1;
  #selected: number = -1;

  constructor(el: HTMLElement) {
    if (!(el instanceof HTMLSelectElement)) {
      throw new Error("Selektt only works with select elements");
    }

    this.#select = el as HTMLSelectElement;

    if (el.id) {
      this.#id = el.id;
      el.id = "";
    } else {
      this.#id = Math.random().toString(36).substring(2, 15);
    }

    this.#select.tabIndex = -1;
    this.#select.style.display = "none";
    const parent = el.parentElement;

    // Create the initial structure
    this.#wrapper = document.createElement("div");
    this.#wrapper.classList.add("selektt");
    this.#wrapper.append(el);

    this.#field = document.createElement("div");
    this.#field.classList.add("selektt-field");
    this.#field.textContent = "Select an option...";
    this.#field.tabIndex = 0;
    this.#field.addEventListener("click", (e) => {
      e.preventDefault();
      this.toggle();
    });
    this.#field.addEventListener("keydown", (e) => {
      if (
        e.key === "Enter" ||
        e.key === " " ||
        e.key === "ArrowDown" ||
        e.key === "ArrowUp"
      ) {
        e.preventDefault();
        e.stopPropagation();
        this.toggle();
      }
    });
    this.#wrapper.append(this.#field);

    this.#dropdown = document.createElement("div");
    this.#dropdown.classList.add("selektt-dropdown");

    this.#input = document.createElement("input");
    this.#input.classList.add("selektt-input");
    this.#input.role = "combobox";
    this.#input.type = "text";
    this.#input.autocomplete = "off";
    this.#input.spellcheck = false;
    this.#input.ariaAutoComplete = "list";
    this.#input.setAttribute("aria-controls", this.#id + "-listbox");
    this.#input.ariaExpanded = "false";
    this.#input.id = this.#id;
    this.#input.addEventListener("input", () => {
      this.#search = this.#input.value;
      this.#highlighted = -1;
      this.renderDropdown();
    });
    this.#input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        this.close();
      }
      if (e.key === "Tab") {
        this.close(false);
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        this.#highlightNext();
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        this.#highlightPrevious();
      }
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        const option = this.#options[this.#highlighted];
        if (option) {
          (option as HTMLElement).click();
        }
      }
    });
    this.#dropdown.append(this.#input);

    this.#listbox = document.createElement("ul");
    this.#listbox.classList.add("selektt-listbox");
    this.#listbox.role = "listbox";
    this.#listbox.id = this.#id + "-listbox";
    this.#listbox.ariaHidden = "true";

    this.#dropdown.append(this.#listbox);
    this.#wrapper.append(this.#dropdown);

    parent?.append(this.#wrapper);

    this.#populateDropdown();

    // Global event listeners
    // TODO: Remove event listeners when the element is removed from the DOM
    document.addEventListener("click", (e) => {
      if (!this.#wrapper.contains(e.target as Node)) {
        e.preventDefault();
        e.stopPropagation();
        this.close(false);
      }
    });
  }

  renderDropdown() {
    const options = this.#options;
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      option.classList.remove("selektt-hidden");
      if (
        this.#search &&
        !option.textContent?.toLowerCase().includes(this.#search.toLowerCase())
      ) {
        option.classList.add("selektt-hidden");
      } else if (this.#highlighted === -1) {
        this.#highlighted = i;
      }

      if (i === this.#highlighted) {
        option.classList.add("selektt-highlighted");
        option.scrollIntoView({ block: "nearest" });
        this.#input.setAttribute("aria-activedescendant", option.id);
      } else {
        option.classList.remove("selektt-highlighted");
      }
    }
  }

  open() {
    if (this.isOpen) return;
    this.#search = "";
    this.#input.value = "";
    this.#highlighted = this.#selected;
    this.#input.setAttribute("aria-expanded", "true");
    this.#listbox.setAttribute("aria-hidden", "false");
    this.renderDropdown();
    this.#wrapper.classList.add("selektt-open");
    this.#input.focus();
  }

  close(focusField = true) {
    if (!this.isOpen) return;
    this.#wrapper.classList.remove("selektt-open");
    this.#input.setAttribute("aria-expanded", "false");
    this.#listbox.setAttribute("aria-hidden", "true");

    // Sometimes we don't want to focus the field after closing.
    // For example, when the user clicks away from the dropdown.
    if (focusField) {
      this.#field.focus();
    }
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  get isOpen() {
    return this.#wrapper.classList.contains("selektt-open");
  }

  get #options() {
    return this.#listbox.querySelectorAll<HTMLLIElement>(".selektt-option");
  }

  /**
   * Populate the dropdown with the options from the select element.
   * This is called only once when the Selektt instance is created.
   */
  #populateDropdown() {
    this.#listbox.innerHTML = "";
    const options = this.#select.querySelectorAll("option");
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      const item = document.createElement("li");
      item.classList.add("selektt-option");
      item.role = "option";
      item.id = this.#id + "-option-" + i;
      item.textContent = option.textContent;
      item.addEventListener("click", () => this.#selectOption(i));
      item.addEventListener("mousemove", () => {
        this.#highlighted = i;
        this.renderDropdown();
      });
      this.#listbox.append(item);

      if (option.selected) {
        this.#field.textContent = item.textContent;
        this.#selected = i;
      }
    }
  }

  #selectOption(index: number) {
    const option = this.#select.querySelectorAll("option")[index];
    this.#field.textContent = option.textContent;
    this.#select.value = option.value;
    this.#selected = index;
    this.close();
  }

  #highlightNext() {
    const options = this.#options;
    const optionsLength = options.length;
    const current = options[this.#highlighted];
    let i = this.#highlighted + 1;
    if (current) {
      let next = current.nextElementSibling;
      while (next !== null && next.classList.contains("selektt-hidden")) {
        next = next.nextElementSibling;
        i++;
        if (i >= optionsLength) {
          // Failsafe to prevent infinite loop
          break;
        }
      }
      if (next && i < optionsLength) {
        this.#highlighted = i;
        this.renderDropdown();
      }
    }
  }

  #highlightPrevious() {
    const current =
      this.#listbox.querySelectorAll<HTMLLIElement>(".selektt-option")[
        this.#highlighted
      ];
    let i = this.#highlighted - 1;
    if (current) {
      let prev = current.previousElementSibling;
      while (prev && prev.classList.contains("selektt-hidden")) {
        prev = prev.previousElementSibling;
        i--;
        if (i < 0) {
          // Failsafe to prevent infinite loop
          break;
        }
      }
      if (prev && i >= 0) {
        this.#highlighted = i;
        this.renderDropdown();
      }
    }
  }
}

export default Selektt;
