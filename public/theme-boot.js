(function () {
  var v = 'classic';
  try {
    var t = localStorage.getItem('cp-theme');
    if (t === 'elegance' || t === 'classic' || t === 'harmony') v = t;
  } catch (e) {}
  document.documentElement.setAttribute('data-cp-theme', v);
})();
