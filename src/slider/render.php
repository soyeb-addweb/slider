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

$extra_attributes = [
	'class'        => 'swiper' . $timeline,
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
        <?php
            // Build inline style variables for thumbs sizing.
            $thumb_style = '';
            if (! empty($attributes['thumbsWidth'])) {
                $thumb_style .= '--slider-thumb-width:' . esc_attr($attributes['thumbsWidth']) . ';';
            }
            if (! empty($attributes['thumbsHeight'])) {
                $thumb_style .= '--slider-thumb-height:' . esc_attr($attributes['thumbsHeight']) . ';';
            }
        ?>
        <div class="swiper wp-block-pixelalbatross-slider__thumbs" <?php echo $thumb_style ? 'style="' . esc_attr($thumb_style) . '"' : ''; ?>>
            <div class="swiper-wrapper">
                <?php
                    // Render thumbnail slides from main content by extracting slide wrappers.
                    // Remove text nodes/headings from thumbs to avoid overlay text.
                    $thumbs_content = preg_replace(
                        '/<div class="wp-block-pixelalbatross-slide__wrapper">([\s\S]*?)<\/div>/m',
                        '<div class="swiper-slide"><div class="wp-block-pixelalbatross-slide__wrapper">$1</div></div>',
                        wp_kses_post($content)
                    );
                    // Strip headings and paragraphs from thumbs; keep images and cover backgrounds.
                    $thumbs_content = preg_replace('/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>|<p[^>]*>[\s\S]*?<\/p>/mi', '', $thumbs_content);
                    echo $thumbs_content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
                ?>
            </div>
        </div>
    <?php endif; ?>

</div>