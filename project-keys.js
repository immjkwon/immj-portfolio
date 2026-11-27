(() => {
  const hero = document.querySelector('.keys');
  if (!hero) return;
  const tabs = Array.from(hero.querySelectorAll('[role="tab"]'));
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
  function select(active) {
    tabs.forEach((tab, index) => {
      const selected = tab === active;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      panels[index].hidden = !selected;
    });
  }
  const keyboard = hero.querySelector('[role="tablist"]');
  keyboard.addEventListener('click', event => {
    const tab = event.target.closest('[role="tab"]');
    if (tab) select(tab);
  });
  keyboard.addEventListener('keydown', event => {
    const index = tabs.indexOf(event.target);
    if (index < 0) return;
    const next = {ArrowRight:(index + 1) % tabs.length, ArrowLeft:(index + tabs.length - 1) % tabs.length, Home:0, End:tabs.length - 1}[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(tabs[next]);
    tabs[next].focus();
  });
  hero.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#impact-tab-"]');
    if (link) {
      const tab = document.querySelector(link.hash);
      tab?.click();
      tab?.focus({preventScroll:true});
    }
  });
})();
