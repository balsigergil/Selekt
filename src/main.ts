import Selektt from "../lib/main.ts";

const els = document.querySelectorAll("select");
els.forEach((el) => {
  new Selektt(el as HTMLElement);
});

//
// document.addEventListener("focusin", (e) => {
//   console.log("focusin", e.target);
// });
//
// document.addEventListener("focusout", (e) => {
//   console.log("focusout", e.target);
// });
