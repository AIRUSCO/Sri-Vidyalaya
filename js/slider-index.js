$(window).on('load', function () {
    var $mainSlider = $('#js-main-slider');
    var sliderConfig = {
        autoplay: true,
        autoplayTimeout: 5000,
        displayProgess: true,
        preserveTargetSize: true,
        targetWidth: 1000,
        targetHeight: 110,
        responsive: true,
        pauseOnHover: true,
        generateNav: true,
        generateButtons: true
    };

    if (!$mainSlider.length || typeof $.fn.pogoSlider !== 'function') {
        return;
    }

    if ($mainSlider.find('.pogoSlider-slide').length <= 1) {
        $mainSlider
            .addClass('pogoSlider--static')
            .css('padding-bottom', (100 / (sliderConfig.targetWidth / sliderConfig.targetHeight)) + '%');
        return;
    }

    $mainSlider.pogoSlider(sliderConfig);
});
