/* eslint-disable import/no-extraneous-dependencies */
/**
 * External dependencies
 */
import Swiper, {
	A11y,
	Keyboard,
	HashNavigation,
	Autoplay,
	Navigation,
	Pagination,
	FreeMode,
	EffectFade,
	Thumbs,
} from 'swiper';

/**
 * Parses a quantity and unit from a raw string value.
 */
export function parseQuantityAndUnitFromRawValue(rawValue) {
	const allowedUnits = ['px', '%', 'em', 'rem', 'vw', 'vh'];

	let trimmedValue;
	let quantityToReturn;

	if (typeof rawValue !== 'undefined' && rawValue !== null) {
		trimmedValue = `${rawValue}`.trim();
		const parsedQuantity = parseFloat(trimmedValue);
		quantityToReturn = !isFinite(parsedQuantity) ? undefined : parsedQuantity;
	}

	const unitMatch = trimmedValue?.match(/[\d.\-\+]*\s*(.*)/);
	const matchedUnit = unitMatch?.[1]?.toLowerCase();
	const match = allowedUnits.find((item) => item === matchedUnit);
	const unitToReturn = match || undefined;

	return [quantityToReturn, unitToReturn];
}

/**
 * Initialize the slider.
 *
 * @param {Element|string} container HTMLElement or selector.
 * @param {Object} options Slider parameters.
 * @return {Object} Returns initialized slider instance.
 */
export function initSlider(container, options = {}) {
    const parameters = {
        modules: [A11y, Keyboard],
        speed: options?.speed ?? 300,
        loop: options?.loop ?? false,
        rewind: options?.rewind ?? false,
        autoHeight: options?.autoHeight ?? false,
        slidesPerView: options?.perViewDesktop ?? 1,
        centeredSlides: options?.centerSlides ?? false,
        simulateTouch: options?.drag ?? true,
        grabCursor: options?.drag ?? true,
        focusableElements:
            options?.focusableSelectors ?? 'input, select, option, textarea, button, video, label',
        autoplay: false,
        navigation: true,
        pagination: false,
        freeMode: false,
        keyboard: true,
        // Use slide effect by default; only enable fade when perView is 1
        effect: (options?.perViewDesktop ?? 1) === 1 ? 'fade' : 'slide',
        fadeEffect: { crossFade: true },
        a11y: {
            containerRoleDescriptionMessage: 'carousel',
            itemRoleDescriptionMessage: 'slide',
            containerMessage: options?.ariaLabel ?? null,
            firstSlideMessage: options?.i18n?.first ?? 'This is the first slide',
            lastSlideMessage: options?.i18n?.last ?? 'This is the last slide',
            nextSlideMessage: options?.i18n?.next ?? 'Next slide',
            paginationBulletMessage: options?.i18n?.slideX ?? 'Go to slide {{index}}',
            prevSlideMessage: options?.i18n?.prev ?? 'Previous slide',
            slideLabelMessage: options?.i18n?.slideLabel ?? '{{index}} / {{slidesLength}}',
        },
    };

    // Ensure fade module is present when needed
    if (parameters.effect === 'fade') {
        parameters.modules.push(EffectFade);
    }

	// ✅ Timeline / Progress Bars
	if (options?.timeline) {
		const slides = container.querySelectorAll('.swiper-slide');
		const progressContainer = document.querySelector(options?.progressContainer ?? '.progress-container');
		const groupProgressView = options?.groupProgressView ?? 3;
		const slideDelay = options?.autoplayInterval ?? 3000;
		const prevEmptyDuration = 500;
		let currentSlideIndex = 0;

		function createProgressBars(startIndex) {
			if (!progressContainer) return; // ✅ Prevent null error
			progressContainer.innerHTML = "";
			for (let i = 0; i < groupProgressView; i++) {
				const wrapper = document.createElement("div");
				wrapper.classList.add("progress-bar-wrapper");

				const heading = document.createElement("div");
				heading.classList.add("progress-bar-heading");
				heading.innerText = slides[startIndex + i]
					? slides[startIndex + i].querySelector(".slide-heading.wp-block-heading")?.innerText ?? ""
					: "";

				const bar = document.createElement("div");
				bar.classList.add("progress-bar");

				const fill = document.createElement("div");
				fill.classList.add("progress-bar-fill");

				bar.appendChild(fill);
				wrapper.appendChild(heading);
				wrapper.appendChild(bar);
				progressContainer.appendChild(wrapper);
			}
		}

		function animateSlideContent(index) {
			slides.forEach(slide => {
				slide.querySelector(".slide-heading.wp-block-heading")?.classList.remove("fade-in-bottom");
				slide.querySelector(".wp-block-pixelalbatross-slide__wrapper p")?.classList.remove("fade-in-bottom");
				slide.querySelector(".wp-block-column img")?.classList.remove("fade-in-right");
			});

			const currentSlide = slides[index];
			if (currentSlide) {
				currentSlide.querySelector(".swiper-timeline .wp-block-heading")?.classList.add("fade-in-bottom");
				currentSlide.querySelector(".wp-block-pixelalbatross-slide__wrapper p")?.classList.add("fade-in-bottom");
				currentSlide.querySelector(".wp-block-column img")?.classList.add("fade-in-right");
			}
		}

		function setProgressGroup(activeIndex) {
			const groupStart = Math.floor(activeIndex / groupProgressView) * groupProgressView;
			createProgressBars(groupStart);
		}

		function runProgress(swiper, startIndex, direction = "next") {
			currentSlideIndex = startIndex;
			const fills = progressContainer?.querySelectorAll(".progress-bar-fill") ?? [];
			const barIndex = currentSlideIndex % groupProgressView;

			// Reset all bars
			fills.forEach(fill => {
				fill.style.transition = "none";
				fill.style.width = "0%";
			});

			// Animate current bar
			if (fills[barIndex]) {
				fills[barIndex].offsetWidth; // reflow
				fills[barIndex].style.transition = `width ${slideDelay}ms linear`;
				fills[barIndex].style.width = "100%";
			}

			// Auto move forward
			clearTimeout(window.progressTimer);
			window.progressTimer = setTimeout(() => {
				let nextIndex = currentSlideIndex + 1;
				if (nextIndex < slides.length) {
					swiper.slideTo(nextIndex);
				}
			}, slideDelay);
		}

		parameters.on = {
			init(swiper) {
				currentSlideIndex = 0;
				animateSlideContent(0);
				setProgressGroup(0);
				runProgress(swiper, 0);
			},
			slideChange(swiper) {
				const direction = swiper.activeIndex > currentSlideIndex ? "next" : "prev";
				currentSlideIndex = swiper.activeIndex;
				animateSlideContent(swiper.activeIndex);
				setProgressGroup(swiper.activeIndex);
				runProgress(swiper, swiper.activeIndex, direction);
			},
		};
	}

	// ✅ Handle responsive breakpoints
	if (
		options?.breakpointDesktop &&
		options?.perViewDesktop &&
		options?.breakpointTablet &&
		options?.perViewTablet &&
		options?.perViewMobile
	) {
		parameters.breakpoints = {
			[options.breakpointTablet]: { slidesPerView: options.perViewTablet },
			[options.breakpointDesktop]: { slidesPerView: options.perViewDesktop },
			0: { slidesPerView: options.perViewMobile },
		};
	} else if (options?.breakpoints) {
		parameters.breakpoints = options.breakpoints; // fallback if custom object provided
	}

	// Optional dimensions
	if (options?.width) {
		const [parsedQuantity] = parseQuantityAndUnitFromRawValue(options?.width);
		parameters.width = parsedQuantity;
	}
	if (options?.height) {
		const [parsedQuantity] = parseQuantityAndUnitFromRawValue(options?.height);
		parameters.height = parsedQuantity;
	}
	if (options?.spaceBetween) {
		const [parsedQuantity] = parseQuantityAndUnitFromRawValue(options?.spaceBetween);
		parameters.spaceBetween = parsedQuantity;
	}

	// Autoplay
	if (options?.autoplay) {
		parameters.modules.push(Autoplay);
		parameters.autoplay = {
			delay: options?.autoplayInterval ?? 3000,
			pauseOnMouseEnter: options?.autoplayPauseOnHover ?? false,
		};
	}

	// Navigation
	if (options?.navigation) {
		parameters.modules.push(Navigation);
		parameters.navigation = {
			nextEl: '.swiper-button-next',
			prevEl: '.swiper-button-prev',
		};
	}

	// Pagination
	if (options?.pagination) {
		parameters.modules.push(Pagination);
		parameters.pagination = {
			el: '.swiper-pagination',
			type: options?.paginationType ?? 'bullets',
			dynamicBullets: options.totalSlides > 5,
			clickable: options?.pagination?.clickable ?? true,
		};
	}

	// FreeMode
	if (options?.freeMode) {
		parameters.modules.push(FreeMode);
		parameters.freeMode = true;
	}

	// HashNavigation
	if (options?.hashNavigation) {
		parameters.modules.push(HashNavigation);
		parameters.hashNavigation = true;
	}

	/**
	 * ✅ Thumbnail slider (preserved original code)
	 */
    let thumbsSwiper = null;
    if (options?.thumbs && options?.thumbs.el) {
        parameters.modules.push(Thumbs);
        const parent = container.parentElement || container.closest('.wp-block-pixelalbatross-slider');
        const thumbsContainer = parent ? parent.querySelector(options.thumbs.el) : null;
        if (thumbsContainer) {
            // If thumbs container has no slides (e.g., in editor), clone from main slides.
            if (!thumbsContainer.querySelector('.swiper-slide')) {
                const mainSlides = container.querySelectorAll('.swiper-wrapper .swiper-slide');
                const thumbsWrapper = thumbsContainer.querySelector('.swiper-wrapper') || thumbsContainer;
                mainSlides.forEach((slide) => {
                    const clone = slide.cloneNode(true);
                    // Remove text blocks inside clone for thumbs cleanliness
                    clone.querySelectorAll('h1,h2,h3,h4,h5,h6,p,.wp-block-buttons,.wp-block-quote,.wp-block-table,.wp-block-list').forEach((el) => el.remove());
                    thumbsWrapper.appendChild(clone);
                });
            }

            // Sanitize and apply fixed size via CSS variables if provided
            let hasFixedThumbWidth = false;
            if (options?.thumbs?.width) {
                const [parsedWidthQty, parsedWidthUnit] = parseQuantityAndUnitFromRawValue(options.thumbs.width);
                if (typeof parsedWidthQty !== 'undefined') {
                    const widthToApply = `${parsedWidthQty}${parsedWidthUnit || 'px'}`;
                    thumbsContainer.style.setProperty('--slider-thumb-width', widthToApply);
                    hasFixedThumbWidth = true;
                }
            }
            if (options?.thumbs?.height) {
                const [parsedHeightQty, parsedHeightUnit] = parseQuantityAndUnitFromRawValue(options.thumbs.height);
                if (typeof parsedHeightQty !== 'undefined') {
                    const heightToApply = `${parsedHeightQty}${parsedHeightUnit || 'px'}`;
                    thumbsContainer.style.setProperty('--slider-thumb-height', heightToApply);
                }
            }

            const slidesPerView = hasFixedThumbWidth ? 'auto' : (options?.thumbs?.perView ?? 4);
            thumbsSwiper = new Swiper(thumbsContainer, {
                modules: [FreeMode],
                spaceBetween: options?.thumbs?.spaceBetween ?? 10,
                slidesPerView,
                freeMode: true,
                watchSlidesProgress: true,
            });
            parameters.thumbs = { swiper: thumbsSwiper };
        }
    }

	// ✅ Initialize main Swiper
	const swiperInstance = new Swiper(container, parameters);
	return {
		main: swiperInstance,
		thumbs: thumbsSwiper,
	};
	 
}
