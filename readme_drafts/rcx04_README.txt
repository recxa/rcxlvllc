
================================================================================

                                   r c x 0 4
                               lifebrush
                        game of life drawing tool

================================================================================


    lifebrush is a browser-based drawing tool where your strokes come
    alive. draw on the canvas, and after a few cells are lit, Conway's
    Game of Life takes over—your drawing evolves, mutates, and settles
    into new forms.

    save layers, change colors, let patterns stack and interact. download
    your creation as a PNG when you're done.

    live at rcxlvllc.com/lifebrush


================================================================================
                                  HOW IT WORKS
================================================================================


    DRAW → EVOLVE → LAYER → REPEAT
    ──────────────────────────────────────────────────────────────────────

        1. draw on the canvas (click/touch to light up cells)

        2. after ~20 cells are activated, Game of Life rules apply
           automatically—your drawing evolves one generation

        3. keep drawing to trigger more evolution, or save your
           current pattern as a layer

        4. layers persist in the background. start a new drawing
           on top, in a different color

        5. evolve all layers forward together, or just keep stacking


    THE GRID
    ──────────────────────────────────────────────────────────────────────

    the canvas is divided into a grid of cells. resolution is randomized
    each session (8–33 pixels per cell), so the scale varies.

    the grid wraps at the edges (toroidal topology)—patterns that drift
    off one side reappear on the other.


    CONWAY'S RULES
    ──────────────────────────────────────────────────────────────────────

        · alive + <2 neighbors     →  dies
        · alive + 2-3 neighbors    →  survives
        · alive + >3 neighbors     →  dies
        · dead + exactly 3 neighbors  →  born

    these rules turn simple drawings into gliders, oscillators, still
    lifes, and chaos.


================================================================================
                                   CONTROLS
================================================================================


    MOUSE
    ──────────────────────────────────────────────────────────────────────

        click + drag       draw (light up cells)
        left click         save current drawing as layer, start fresh
        right click        change brush color (keep drawing)


    TOUCH (mobile)
    ──────────────────────────────────────────────────────────────────────

        1 finger drag      draw
        1 finger tap       save layer, start fresh
        2 finger tap       change brush color


    KEYBOARD
    ──────────────────────────────────────────────────────────────────────

        SPACE              random color + new grid resolution
        UP ARROW           evolve all layers forward one generation
        ENTER              download canvas as PNG
        DELETE / BACKSPACE full reset (clear everything)


================================================================================
                                   LAYERS
================================================================================


    each time you save (left click / tap), your current drawing becomes
    a layer with its own color. the canvas resets, but your layer stays
    visible underneath.

    layers are independent Game of Life simulations. when you press UP,
    each layer evolves according to its own cell states—they don't
    interact with each other, just visually overlap.

    this lets you compose images from multiple evolving patterns,
    each frozen at different moments or progressed together.


================================================================================
                                    NOTES
================================================================================


    · resolution is random each session. press SPACE to reshuffle.

    · the 20-cell threshold gives you time to draw before evolution
      kicks in. it's not per-frame simulation—it's triggered by
      your activity.

    · colors are random. right-click or 2-finger tap to roll a new one.

    · PNG export captures whatever's on screen—all layers composited.

    · works on desktop and mobile. the bottom bar on mobile shows
      touch feedback.


                                    · · ·


    lifebrush is for playing. draw something, watch it breathe,
    save it, draw on top, let the layers pile up.

    simple as that.


================================================================================

                                                          rcxlvllc.com/lifebrush

