import "./style.css";
import "./classic-theme.css";

class Selektt {
  readonly #select: HTMLSelectElement;
  readonly #label: HTMLLabelElement | null = null;
  readonly #wrapper: HTMLDivElement;

  readonly #field: HTMLDivElement;
  readonly #values: HTMLDivElement;
  readonly #chevron: HTMLDivElement;

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

    if (this.#select.id) {
      this.#id = this.#select.id;
      this.#select.id = "";

      this.#label = document.querySelector<HTMLLabelElement>(
        `label[for="${this.#id}"]`,
      );
      if (this.#label) {
        this.#label.addEventListener("click", () => {
          this.open();
        });
      }
    } else {
      this.#id = Math.random().toString(36).substring(2, 15);
    }

    this.#select.style.display = "none";
    this.#select.ariaHidden = "true";
    const parent = this.#select.parentElement;

    // Create the initial structure
    this.#wrapper = document.createElement("div");
    this.#wrapper.classList.add("selektt");
    this.#wrapper.append(this.#select);

    this.#field = document.createElement("div");
    this.#field.classList.add("selektt-field");
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
    this.#values = document.createElement("div");
    this.#values.classList.add("selektt-values");
    this.#values.textContent = "Select an option...";
    this.#chevron = document.createElement("div");
    this.#chevron.classList.add("selektt-chevron");
    this.#chevron.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
    this.#field.append(this.#values, this.#chevron);
    this.#wrapper.append(this.#field);

    this.#select.addEventListener("invalid", (e) => {
      e.preventDefault();
      this.#wrapper.classList.add("selektt-invalid");
    });

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
    this.#input.placeholder = "Search...";
    this.#input.addEventListener("input", () => {
      this.#search = this.#input.value;
      this.#highlighted = -1;
      this.#renderDropdown();
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
      if (
        !this.#wrapper.contains(e.target as Node) &&
        (!this.#label || !this.#label.contains(e.target as Node))
      ) {
        this.close(false);
      }
    });
  }

  open() {
    if (this.isOpen) return;
    this.#search = "";
    this.#input.value = "";
    this.#highlighted = this.#selected;
    this.#input.setAttribute("aria-expanded", "true");
    this.#listbox.setAttribute("aria-hidden", "false");
    this.#renderDropdown();
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
    const rawOptions = this.#select.querySelectorAll("option");
    for (let i = 0; i < rawOptions.length; i++) {
      const option = rawOptions[i];
      const item = document.createElement("li");
      item.classList.add("selektt-option");
      if (option.value === "") {
        item.classList.add("selektt-placeholder");
      }
      item.role = "option";
      item.id = this.#id + "-option-" + i;
      item.textContent = option.textContent;
      item.addEventListener("click", () => this.#selectOption(i));
      item.addEventListener("mousemove", () => {
        this.#highlighted = i;
        this.#renderDropdown();
      });
      this.#listbox.append(item);

      if (option.selected) {
        this.#values.textContent = item.textContent;
        this.#selected = i;
      }
    }
  }

  #renderDropdown() {
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

      if (i === this.#selected) {
        option.classList.add("selektt-selected");
      } else {
        option.classList.remove("selektt-selected");
      }
    }
  }

  #selectOption(index: number) {
    const option = this.#select.querySelectorAll("option")[index];
    this.#values.textContent = option.textContent;
    // option.selected = true;
    this.#select.value = option.value;
    this.#selected = index;
    this.#wrapper.classList.remove("selektt-invalid");
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
        this.#renderDropdown();
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
        this.#renderDropdown();
      }
    }
  }
}

export default Selektt;
