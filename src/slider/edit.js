/* eslint-disable no-shadow */
/* eslint-disable @wordpress/no-unsafe-wp-apis */
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	useInnerBlocksProps,
	useBlockEditContext,
	store as blockEditorStore,
	BlockControls,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	ToolbarGroup,
	ToolbarButton,
	PanelBody,
	PanelRow,
	SelectControl,
	ToggleControl,
	TextControl,
	RangeControl,
	__experimentalNumberControl as NumberControl,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';
import { memo } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { useSelect, useDispatch, select, subscribe } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { initSlider } from './utils';

const focusableSelectors = [
	'a[href]',
	'area[href]',
	'input:not([disabled]):not([type="hidden"]):not([aria-hidden])',
	'select:not([disabled]):not([aria-hidden])',
	'textarea:not([disabled]):not([aria-hidden])',
	'button:not([disabled]):not([aria-hidden])',
	'iframe',
	'object',
	'embed',
	'[contenteditable]',
	'[tabindex]:not([tabindex^="-"])',
];

/**
 * Slider toolbar.
 */
const SliderToolbar = memo(({ clientId }) => {
	const { insertBlock, selectBlock } = useDispatch(blockEditorStore);
	const innerBlocks = useSelect(
		(select) => select(blockEditorStore).getBlock(clientId).innerBlocks,
	);

	const addSlide = () => {
		const block = createBlock('pixelalbatross/slide');
		insertBlock(block, innerBlocks.length, clientId, false);
		selectBlock(block.clientId);
	};

	return (
		<ToolbarGroup>
			<ToolbarButton icon="plus" onClick={addSlide}>
				{__('Add slide', 'slider-block')}
			</ToolbarButton>
		</ToolbarGroup>
	);
});

/**
 * Slides component.
 */
const Slides = memo(() => {
	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'swiper-wrapper wp-block-pixelalbatross-slider__wrapper',
		},
		{
			allowedBlocks: ['pixelalbatross/slide'],
			template: [['pixelalbatross/slide'], ['pixelalbatross/slide']],
			renderAppender: false,
			orientation: 'horizontal',
		},
	);

	return <div {...innerBlocksProps} />;
});

/**
 * Slider component.
 */
const Slider = memo(({ clientId, attributes }) => {
    const { navigation, pagination } = attributes;

    const sliderRef = useRefEffect((element) => {
        // Build options for editor with safe defaults
        const options = {
            ...attributes,
            autoplay: false,
            drag: false,
            focusableSelectors,
            hashNavigation: false,
            pagination: {
                clickable: false,
            },
        };

        // Provide thumbs configuration object in editor as well
        if (attributes?.thumbs) {
            options.thumbs = {
                el: '.wp-block-pixelalbatross-slider__thumbs',
                perView: attributes?.thumbsPerView,
                spaceBetween: attributes?.thumbsSpaceBetween,
                width: attributes?.thumbsWidth,
                height: attributes?.thumbsHeight,
            };
        }

        // Initialize slider.
        let slider = initSlider(element, options);

		// Store the current slide order to detect changes, such as adding, removing, or reordering slides.
		let slideOrder = select(blockEditorStore).getBlockOrder(clientId);

		// Subscribe slider update events like adding, removing, or reordering slides.
		const unsubscribeSliderUpdateListener = subscribe(() => {
			const currentSlidesOrder = select(blockEditorStore).getBlockOrder(clientId);

			// Check if the slider has been changed.
			if (currentSlidesOrder.toString() !== slideOrder.toString()) {
				const selectedBlock = select(blockEditorStore).getSelectedBlock();
				const slideAdded = currentSlidesOrder.length > slideOrder.length;
				const slideRemoved = currentSlidesOrder.length < slideOrder.length;
				const slideMoved = currentSlidesOrder.length === slideOrder.length;
                const activeIndex = slider?.main?.activeIndex ?? 0;

				// Store the current slide order before destroying the slider instance.
				slideOrder = currentSlidesOrder;
                // Destroy current instances before re-init
                if (slider?.main) {
                    slider.main.destroy();
                }
                if (slider?.thumbs) {
                    slider.thumbs.destroy();
                }

				window.requestAnimationFrame(() => {
                    // Initialize slider.
                    slider = initSlider(element, options);

					// Determine where the slider should go.
					let slideToIndex = activeIndex;
					if (slideAdded) {
						slideToIndex = slideOrder.length;
					} else if (slideRemoved) {
						slideToIndex = activeIndex - 1;
					} else if (slideMoved) {
						slideToIndex = slideOrder.findIndex(
							(clientId) => clientId === selectedBlock.clientId,
						);
					}

					if (slideToIndex < 0) {
						slideToIndex = 0;
					}

                    if (slider?.main) {
                        slider.main.slideTo(slideToIndex, 0);
                    }
				});
			}
		});

		return () => {
			unsubscribeSliderUpdateListener();
            if (slider?.main) {
                slider.main.destroy();
            }
            if (slider?.thumbs) {
                slider.thumbs.destroy();
            }
		};
	});

	return (
		<>
			<BlockControls>
				<SliderToolbar clientId={clientId} />
			</BlockControls>

			<div className="swiper" ref={sliderRef}>
				<Slides />
				{navigation && (
					<>
						<div className="swiper-button-next wp-block-pixelalbatross-slider__button-next"></div>
						<div className="swiper-button-prev wp-block-pixelalbatross-slider__button-prev"></div>
					</>
				)}
				{pagination && (
					<div className="swiper-pagination wp-block-pixelalbatross-slider__pagination"></div>
				)}
			</div>
		</>
	);
});

// eslint-disable-next-line jsdoc/require-param
/**
 * The edit function describes the structure of your block in the context of the
 * editor. This represents what the editor will render when the block is used.
 *
 * @see https://developer.wordpress.org/block-editor/developers/block-api/block-edit-save/#edit
 *
 * @return {WPElement} Element to render.
 */
export default function SliderEdit({ attributes, setAttributes }) {
	const {
		timeline,
		groupProgressView,
		speed,
		loop,
		rewind,
		autoHeight,
		breakpointDesktop,
		breakpointTablet,
		perViewDesktop,
		perViewTablet,
		perViewMobile,
		autoplay,
		autoplayInterval,
		autoplayPauseOnHover,
		navigation,
		hashNavigation,
		pagination,
		paginationType,
		freeMode,
		centerSlides,
		thumbs,
		thumbsPerView,
		thumbsSpaceBetween,
        thumbsWidth,
        thumbsHeight,
		width,
		height,
		spaceBetween,
		ariaLabel,
	} = attributes;
	const { clientId } = useBlockEditContext();
	const blockProps = useBlockProps();

	const enableAutoHeight = applyFilters('pixelalbatross.sliderBlock.enableAutoHeight', false);
	const minSpeed = applyFilters('pixelalbatross.sliderBlock.minSpeed', 100);
	const maxSpeed = applyFilters('pixelalbatross.sliderBlock.maxSpeed', 2000);
	const minPerView = applyFilters('pixelalbatross.sliderBlock.minPerView', 1);
	const maxPerView = applyFilters('pixelalbatross.sliderBlock.maxPerView', 10);
	const desktopRange = applyFilters('pixelalbatross.sliderBlock.desktopRange', 1024);
	const tabletRange = applyFilters('pixelalbatross.sliderBlock.tabletRange', 786);

	return (
		<>
			<div {...blockProps}>
				<Slider clientId={clientId} attributes={attributes} />
				{thumbs && (
					<div className="swiper wp-block-pixelalbatross-slider__thumbs">
						<div className="swiper-wrapper" />
					</div>
				)}
			</div>

			<InspectorControls>
				<PanelBody title={__('Settings', 'slider-block')}>
					<PanelRow>
						<ToggleControl
							label={__('Set as Timeline', 'slider-block')}
							help={__(
								'When enabled, the slider will behave as a carousel.',
								'slider-block',
							)}
							checked={timeline}
							onChange={(value) => setAttributes({ timeline: value })}
						/>
					</PanelRow>
						
						<PanelRow>
							<RangeControl
								label={__('groupProgressView', 'slider-block')}
								help={__(
									'Duration of transition between slides (in milliseconds).',
									'slider-block',
								)}
								value={groupProgressView}
								onChange={(value) => setAttributes({ groupProgressView: value })}
								min={3}
								max={6}
							/>
						</PanelRow>
					
					<PanelRow>
					<ToggleControl
						label={__('Thumbnails', 'slider-block')}
						help={__('Enable thumbnail slider below the main slider.', 'slider-block')}
						checked={thumbs}
						onChange={(value) => setAttributes({ thumbs: value })}
					/>
				</PanelRow>
				{thumbs && (
					<>
						<PanelRow>
							<RangeControl
								label={__('Thumbs Per View', 'slider-block')}
								value={thumbsPerView}
								onChange={(value) => setAttributes({ thumbsPerView: value })}
								min={1}
								max={10}
								step={1}
							/>
						</PanelRow>
						<PanelRow>
							<RangeControl
								label={__('Thumbs Space Between', 'slider-block')}
								value={thumbsSpaceBetween}
								onChange={(value) => setAttributes({ thumbsSpaceBetween: value })}
								min={0}
								max={40}
								step={1}
							/>
						</PanelRow>
                        <PanelRow>
                            <UnitControl
                                label={__('Thumb Width', 'slider-block')}
                                help={__('Override width of each thumbnail (e.g. 120px). Leave empty to use per-view.', 'slider-block')}
                                value={thumbsWidth}
                                onChange={(value) => setAttributes({ thumbsWidth: value })}
                                units={[{ value: 'px', label: 'px' }]}
                            />
                        </PanelRow>
                        <PanelRow>
                            <UnitControl
                                label={__('Thumb Height', 'slider-block')}
                                help={__('Fixed height for thumbnails (e.g. 80px).', 'slider-block')}
                                value={thumbsHeight}
                                onChange={(value) => setAttributes({ thumbsHeight: value })}
                                units={[{ value: 'px', label: 'px' }]}
                            />
                        </PanelRow>
					</>
				)}
				<PanelRow>
						<ToggleControl
							label={__('Loop', 'slider-block')}
							help={__(
								'When enabled, the slider will behave as a carousel.',
								'slider-block',
							)}
							checked={loop}
							onChange={(value) => setAttributes({ loop: value, rewind: false })}
						/>
					</PanelRow>
					<PanelRow>
						<ToggleControl
							label={__('Rewind', 'slider-block')}
							help={__(
								'When enabled, clicking the "next" navigation button on the last slide will take you back to the first slide. When you click the "previous" navigation button on the first slide, it will take you to the last slide.',
								'slider-block',
							)}
							checked={rewind}
							onChange={(value) => setAttributes({ rewind: value, loop: false })}
						/>
					</PanelRow>
					<PanelRow>
						<ToggleControl
							label={__('Autoplay', 'slider-block')}
							checked={autoplay}
							onChange={(value) => setAttributes({ autoplay: value })}
						/>
					</PanelRow>
					<PanelRow>
						<ToggleControl
							label={__('Free Mode', 'slider-block')}
							checked={freeMode}
							onChange={(value) => setAttributes({ freeMode: value })}
						/>
					</PanelRow>
					<PanelRow>
						<ToggleControl
							label={__('Navigation', 'slider-block')}
							checked={navigation}
							onChange={(value) => setAttributes({ navigation: value })}
						/>
					</PanelRow>
					<PanelRow>
						<ToggleControl
							label={__('Pagination', 'slider-block')}
							checked={pagination}
							onChange={(value) => setAttributes({ pagination: value })}
						/>
					</PanelRow>
					<PanelRow>
						<ToggleControl
							label={__('Hash Navigation', 'slider-block')}
							help={__(
								'When enabled, you can load a page with a specific slide open. Each slide requires a "URL Hash", which can be set on each slide block.',
								'slider-block',
							)}
							checked={hashNavigation}
							onChange={(value) => setAttributes({ hashNavigation: value })}
						/>
					</PanelRow>
					<PanelRow>
						<RangeControl
							label={__('Speed', 'slider-block')}
							help={__(
								'Duration of transition between slides (in milliseconds).',
								'slider-block',
							)}
							value={speed}
							onChange={(value) => setAttributes({ speed: value })}
							min={minSpeed}
							max={maxSpeed}
						/>
					</PanelRow>
					<PanelRow>
						<UnitControl
							label={__('Width', 'slider-block')}
							help={__(
								'The slider will not be responsive if this parameter is set.',
								'slider-block',
							)}
							value={width}
							onChange={(value) => setAttributes({ width: value })}
							units={[{ value: 'px', label: 'px' }]}
						/>
					</PanelRow>
					<PanelRow>
						<UnitControl
							label={__('Height', 'slider-block')}
							help={__(
								'The slider will not be responsive if this parameter is set.',
								'slider-block',
							)}
							value={height}
							onChange={(value) => setAttributes({ height: value })}
							units={[{ value: 'px', label: 'px' }]}
						/>
					</PanelRow>
					{enableAutoHeight && (
						<PanelRow>
							<ToggleControl
								label={__('Auto Height', 'slider-block')}
								help={__(
									'When enabled, the slider will adjust its height to match the height of the currently active slide.',
									'slider-block',
								)}
								checked={autoHeight}
								onChange={(value) => setAttributes({ autoHeight: value })}
							/>
						</PanelRow>
					)}
					
					<PanelRow>
					<RangeControl
						label={__('Slides Per View (Desktop)', 'slider-block')}
						help={__(
								'Number of slides per view (slides visible at the same time on desktop).',
								'slider-block',
						)}
						value={perViewDesktop}
						onChange={(value) => setAttributes({ perViewDesktop: value })}
						min={minPerView}
						max={maxPerView}
						step={0.1}
					/>
					</PanelRow>
					<PanelRow>
					<RangeControl
						label={__('Desktop Breakpoint (px)', 'slider-block')}
						help={__(
							'Set the maximum screen width (in pixels) where the desktop layout should apply.',
							'slider-block'
						)}
						value={breakpointDesktop}
						onChange={(value) => setAttributes({ breakpointDesktop: value })}
						min={768}
						max={1600}
						step={1}
					/>
					</PanelRow>

					<PanelRow>
					<RangeControl
						label={__('Slides Per View (Tablet)', 'slider-block')}
						help={__(
								'Number of slides per view (slides visible at the same time on tablet).',
								'slider-block',
						)}
						value={perViewTablet}
						onChange={(value) => setAttributes({ perViewTablet: value })}
						min={minPerView}
						max={maxPerView}
						step={0.1}
					/>
					</PanelRow>
										<PanelRow>
					<RangeControl
						label={__('Tablet Breakpoint (px)', 'slider-block')}
						help={__(
							'Set the maximum screen width (in pixels) where the tablet layout should apply.',
							'slider-block'
						)}
						value={breakpointTablet}
						onChange={(value) => setAttributes({ breakpointTablet: value })}
						min={480}
						max={1024}
						step={1}
					/>
					</PanelRow>
					<PanelRow>
					<RangeControl
						label={__('Slides Per View (Mobile)', 'slider-block')}
						help={__(
								'Number of slides per view (slides visible at the same time on mobile).',
								'slider-block',
						)}
						value={perViewMobile}
						onChange={(value) => setAttributes({ perViewMobile: value })}
						min={minPerView}
						max={maxPerView}
						step={0.1}
					/>
					</PanelRow>			


					<PanelRow>
						<UnitControl
							label={__('Space Between Slides', 'slider-block')}
							help={__('The distance between slides.', 'slider-block')}
							value={spaceBetween}
							onChange={(value) => setAttributes({ spaceBetween: value })}
							units={[{ value: 'px', label: 'px' }]}
						/>
					</PanelRow>
					<PanelRow>
						<ToggleControl
							label={__('Centered Slides', 'slider-block')}
							help={__(
								'When enabled, the active slide will be centered.',
								'slider-block',
							)}
							checked={centerSlides}
							onChange={(value) => setAttributes({ centerSlides: value })}
							disabled={perViewDesktop < 1}
						/>
					</PanelRow>
				</PanelBody>

				{autoplay && (
					<PanelBody title={__('Autoplay', 'slider-block')} initialOpen={false}>
						<PanelRow>
							<NumberControl
								label={__('Delay', 'slider-block')}
								help={__(
									'Delay between transitions (in milliseconds).',
									'slider-block',
								)}
								value={autoplayInterval}
								onChange={(value) => setAttributes({ autoplayInterval: value })}
								step={100}
							/>
						</PanelRow>
						<PanelRow>
							<ToggleControl
								label={__('Pause on Hover', 'slider-block')}
								help={__(
									'When enabled autoplay will be paused on pointer (mouse) enter over the slider.',
									'slider-block',
								)}
								checked={autoplayPauseOnHover}
								onChange={(value) => setAttributes({ autoplayPauseOnHover: value })}
							/>
						</PanelRow>
					</PanelBody>
				)}

				{pagination && (
					<PanelBody title={__('Pagination', 'slider-block')} initialOpen={false}>
						<PanelRow>
							<SelectControl
								label={__('Type', 'slider-block')}
								value={paginationType}
								onChange={(value) => setAttributes({ paginationType: value })}
								options={[
									{
										value: 'bullets',
										label: __('Bullets', 'slider-block'),
									},
									{ value: 'fraction', label: __('Fraction', 'slider-block') },
									{
										value: 'progressbar',
										label: __('Progress Bar', 'slider-block'),
									},
								]}
							/>
						</PanelRow>
					</PanelBody>
				)}

				<PanelBody title={__('Accessibility', 'slider-block')} initialOpen={false}>
					<PanelRow>
						<TextControl
							label={__('Aria Label', 'slider-block')}
							help={__(
								'Sets an aria-label attribute to the root element.',
								'slider-block',
							)}
							value={ariaLabel}
							onChange={(value) => setAttributes({ ariaLabel: value })}
						/>
					</PanelRow>
				</PanelBody>
			</InspectorControls>
		</>
	);
}
