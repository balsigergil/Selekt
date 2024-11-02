import Selektt from "../lib/main.ts";

const els = document.querySelectorAll("select");
els.forEach((el) => {
  new Selektt(el as HTMLElement);
});

const forms = document.querySelectorAll("form");
forms.forEach((form) => {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const values = Object.fromEntries(data.entries());
    console.log(values);
  });
});

//
// document.addEventListener("focusin", (e) => {
//   console.log("focusin", e.target);
// });
//
// document.addEventListener("focusout", (e) => {
//   console.log("focusout", e.target);
// });
