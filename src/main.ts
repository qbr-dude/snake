import { createSignal } from "./signals";

document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('#app');
  
  const [s] = createSignal('1');
  console.log(s());
  
})