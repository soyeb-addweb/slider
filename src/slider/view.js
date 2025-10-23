/**
 * Internal dependencies
 */
import { initSlider } from './utils';

document.addEventListener('DOMContentLoaded', () => {
    const containers = document.querySelectorAll('.wp-block-pixelalbatross-slider');

	if (!containers.length) {
		return;
	}

    containers.forEach((element) => {
		let options = {};
		try {
			options = JSON.parse(element.dataset.options);
		} catch (e) {
			// eslint-disable-next-line no-console
			console.error(e);
			return;
		}

        const slides = element.querySelectorAll('.wp-block-pixelalbatross-slide');
		options.totalSlides = slides.length;

        // If thumbs are enabled, ensure thumbs container exists and is empty (we'll clone main slides)
        if (options?.thumbs?.el) {
            const thumbsContainer = element.querySelector(options.thumbs.el) || element.parentElement?.querySelector(options.thumbs.el);
            if (thumbsContainer) {
                const wrapper = thumbsContainer.querySelector('.swiper-wrapper') || thumbsContainer;
                // Clear any residual content from server render
                wrapper.innerHTML = '';
                // Default width for left/right positions if not set
                const position = options?.thumbsPosition || 'left';
                if ((position === 'left' || position === 'right') && !options?.thumbs?.width) {
                    thumbsContainer.style.setProperty('--slider-thumb-width', '120px');
                }
                // Ensure thumbs container is visible
                thumbsContainer.style.removeProperty('display');
                thumbsContainer.classList.remove('is-hidden');
            }
        }

        // Propagate CSS class for position on frontend
        // Apply default left position if thumbs enabled but no position provided
        const position = options?.thumbsPosition || (options?.thumbs ? 'left' : null);
        if (position) {
            element.classList.add('has-thumbs');
            element.classList.add(`thumbs-pos-${position}`);
        }

        initSlider(element, options);
	});
});
