
(function () {
  const form     = document.getElementById('contact-form');
  const thankyou = document.getElementById('thankyou');

  form.addEventListener('submit', e => {
    e.preventDefault();
    form.style.display = 'none';
    thankyou.hidden = false;
  });
})();
