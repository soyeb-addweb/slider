<?php

/**
 * Slider
 *
 * @var array     $attributes Block attributes.
 * @var string    $content    Block default content.
 * @var \WP_Block $block      Block instance.
 *
 * @package SliderBlock
 */

$options = wp_parse_args(
	$attributes,
	[
		'i18n' => [
			'prev'       => esc_html__('Previous slide', 'slider-block'),
			'next'       => esc_html__('Next slide', 'slider-block'),
			'first'      => esc_html__('This is the first slide', 'slider-block'),
			'last'       => esc_html__('This is the last slide', 'slider-block'),
			'slideX'     => esc_html__('Go to slide {{index}}', 'slider-block'),
			'slideLabel' => esc_html__('{{index}} / {{slidesLength}}', 'slider-block'),
		],
	]
);

/**
 * Filters the slider options.
 *
 * @param array $options Array of slider options.
 */
$options = apply_filters('pixelalbatross_slider_block_slider_options', $options);
$options = array_filter($options);
$timeline =  $attributes['timeline'] == true ? ' swiper-timeline' : '';

$thumbsPosition = ! empty($attributes['thumbsPosition']) ? $attributes['thumbsPosition'] : 'bottom';
$extra_attributes = [
    'class'        => trim('swiper' . $timeline . ' ' . (! empty($attributes['thumbs']) ? 'has-thumbs thumbs-pos-' . esc_attr($thumbsPosition) : '')),
    'data-options' => wp_json_encode($options),
];

// Prepare thumbnails options if enabled.
if (! empty($attributes['thumbs'])) {
    $thumbs_options = [
        'el'            => '.wp-block-pixelalbatross-slider__thumbs',
        'perView'       => isset($attributes['thumbsPerView']) ? (int) $attributes['thumbsPerView'] : 4,
        'spaceBetween'  => isset($attributes['thumbsSpaceBetween']) ? (int) $attributes['thumbsSpaceBetween'] : 10,
    ];

    // Pass optional fixed width/height
    if (! empty($attributes['thumbsWidth'])) {
        $thumbs_options['width'] = $attributes['thumbsWidth'];
    }
    if (! empty($attributes['thumbsHeight'])) {
        $thumbs_options['height'] = $attributes['thumbsHeight'];
    }

    // Merge into options structure passed to JS.
    $decoded = json_decode($extra_attributes['data-options'], true);
    if (is_array($decoded)) {
        $decoded['thumbs'] = $thumbs_options;
        if (! empty($attributes['thumbsPosition'])) {
            $decoded['thumbsPosition'] = $attributes['thumbsPosition'];
        }
        $extra_attributes['data-options'] = wp_json_encode($decoded);
    }
}

?>

<div <?php echo get_block_wrapper_attributes($extra_attributes); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped 
        ?>>

	<div class="swiper-wrapper wp-block-pixelalbatross-slider__wrapper">
		<?php echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped 
		?>
	</div>

	<?php if (! empty($attributes['navigation'])) : ?>
		<div class="swiper-button-next wp-block-pixelalbatross-slider__button-next"></div>
		<?php if (! empty($attributes['timeline'])) : ?>
			<div class="progress-container" id="progressContainer"></div>
		<?php endif; ?>
		<div class="swiper-button-prev wp-block-pixelalbatross-slider__button-prev"></div>
	<?php endif; ?>

	<?php if (! empty($attributes['pagination'])) : ?>
		<div class="swiper-pagination wp-block-pixelalbatross-slider__pagination"></div>
	<?php endif; ?>

    <?php if (! empty($attributes['thumbs'])) : ?>
        <div class="swiper wp-block-pixelalbatross-slider__thumbs">
            <div class="swiper-wrapper"></div>
        </div>
    <?php endif; ?>

</div>