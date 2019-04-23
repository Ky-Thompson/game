export function show(element: HTMLElement) {
  element.style.display = 'block';
  element.hidden = false;
}

export function hide(element: HTMLElement) {
  element.style.display = 'none';
  element.hidden = true;
}
