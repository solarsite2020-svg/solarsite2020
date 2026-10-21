(function () {
  var roots = document.querySelectorAll("[data-slideshow]");
  if (!roots.length) return;

  roots.forEach(function (root) {
    var slides = root.querySelectorAll(".slideshow-slide");
    if (slides.length < 2) {
      if (slides[0]) slides[0].classList.add("is-active");
      return;
    }

    var index = 0;
    var speed = parseInt(root.getAttribute("data-interval") || "5000", 10);
    var timer = null;

    function show(i) {
      slides[index].classList.remove("is-active");
      index = (i + slides.length) % slides.length;
      slides[index].classList.add("is-active");
    }

    function next() {
      show(index + 1);
    }

    function prev() {
      show(index - 1);
    }

    function startAutoplay() {
      stopAutoplay();
      if (speed > 0) timer = setInterval(next, speed);
    }

    function stopAutoplay() {
      if (timer) clearInterval(timer);
      timer = null;
    }

    slides[0].classList.add("is-active");

    var prevBtn = root.querySelector(".slideshow-btn-prev");
    var nextBtn = root.querySelector(".slideshow-btn-next");
    if (prevBtn) prevBtn.addEventListener("click", function () { prev(); startAutoplay(); });
    if (nextBtn) nextBtn.addEventListener("click", function () { next(); startAutoplay(); });

    root.addEventListener("mouseenter", stopAutoplay);
    root.addEventListener("mouseleave", startAutoplay);
    startAutoplay();
  });
})();
