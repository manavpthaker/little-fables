Little Fables Style Guide Documentation

Version: 1.0
Date: Dynamic Based on Story Onboarding
Purpose: This style guide adapts dynamically to the specifics of each story, as defined during onboarding. It ensures stylistic coherence and aligns with locked designs, character profiles, and scene templates.

1. Visual Style Guidelines

1.1. Art Styles
	•	Selected Style: {{ art_style }}
	•	Example Inputs:
	•	Dreamy Watercolor
	•	Bold Cartoons
	•	Rustic Crayon
	•	Key Features:
	•	Edges: {{ edge_style }} (e.g., “soft,” “sharp”)
	•	Textures: {{ texture_style }} (e.g., “visible brush strokes,” “smooth gradients”)
	•	Atmosphere: {{ atmosphere_style }} (e.g., “warm and festive,” “cool and mysterious”)
	•	Dynamic Notes:
The visual style chosen during onboarding influences:
	•	Scene composition
	•	Character proportions
	•	Text and prop placement

1.2. Color Palette
	•	Primary Colors: {{ primary_colors }}
	•	Example Inputs:
	•	#FFD700 (Golden Yellow)
	•	#33A1C9 (Ocean Blue)
	•	#FF5733 (Festive Red)
	•	Accent Colors: {{ accent_colors }}
	•	Example Inputs:
	•	#C0C0C0 (Magical Silver)
	•	#A8E6CF (Soft Mint Green)
	•	Dynamic Notes:
	•	Primary colors are used for backgrounds and major elements.
	•	Accent colors highlight magical or interactive story features.

2. Character Design

2.1. Proportions
	•	Characters:
	•	Main Character Proportions: {{ main_character_proportions }}
	•	Example Inputs:
	•	Head-to-body ratio: 1:3
	•	Slight exaggeration for expressiveness.
	•	Supporting Character Proportions: {{ supporting_character_proportions }}
	•	Example Inputs:
	•	Adults: Head-to-body ratio: 1:6
	•	Animals: Head-to-body ratio: 1:2.5
	•	Dynamic Notes:
Proportions should reflect the tone of the story (e.g., whimsical proportions for lighthearted tales, realistic proportions for serious narratives).

2.2. Locked Designs
	•	Defined During Onboarding:
	•	Key Features for Characters:
	•	{{ character_features }} (e.g., Jujy’s snowflake cape, Ava’s floppy ears).
	•	Proportions, accessory placement, and dynamic adjustments for action scenes.
	•	Expression Range:
	•	{{ emotional_boundaries }} (e.g., fear, joy, curiosity).
	•	Boundaries ensure the character remains appealing and recognizable.
	•	Dynamic Notes:
	•	Locked designs prevent inconsistencies when revisiting characters across scenes.
	•	All updates to locked designs are tracked via versioning.

3. Scene Composition

3.1. Dimensions
	•	Page Layout:
	•	Orientation: {{ page_orientation }} (e.g., “landscape” or “portrait”).
	•	Dimensions: {{ width }} x {{ height }} inches.

3.2. Templates
	•	Selected Template: {{ scene_template }}
	•	Example Inputs:
	•	Template Name: “Winter Forest Adventure”
	•	Zones:
	•	Text: Bottom third of the page.
	•	Characters: Center mid-ground.

4. Lighting and Atmosphere

4.1. Primary Lighting
	•	Source: {{ primary_lighting }}
	•	Example Inputs:
	•	Warm Sunlight
	•	Moonlight Glow

4.2. Secondary Effects
	•	Interactions:
	•	Blend with primary source for realistic highlights and shadows.
	•	Examples:
	•	Magical sparkles
	•	Flickering fireplace

5. Validation Rules
	•	Proportion Validation:
	•	Ensure locked proportions are maintained across all poses and scenes.
	•	Dynamic scaling is allowed but must preserve character recognizability.
	•	Style Compliance:
	•	Verify adherence to chosen textures, color palettes, and lighting effects.
	•	Scene Flow:
	•	Ensure visual harmony and proper spacing in multi-character or dynamic scenes.

Dynamic Updates
	•	Onboarding Input Integration:
	•	All placeholders (e.g., {{ primary_colors }}, {{ character_features }}) are dynamically populated based on onboarding selections.
	•	Mid-Story Updates:
	•	Style elements can be adjusted mid-project, with:
	•	Validation of changes across previous and future scenes.
	•	User approval for any significant updates.
