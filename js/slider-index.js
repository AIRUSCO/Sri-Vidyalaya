$(window).on('load', function () {
    var $mainSlider = $('#js-main-slider');

    if (!$mainSlider.length || typeof $.fn.pogoSlider !== 'function') {
        return;
    }

    $mainSlider.pogoSlider({
        autoplay: true,
        autoplayTimeout: 5000,
        displayProgess: true,
        preserveTargetSize: true,
        targetWidth: 1000,
        targetHeight: 420,
        responsive: true,
        pauseOnHover: true,
        generateNav: true,
        generateButtons: true
    });
});