
================================================================================

                                   r c x 0 5
                              noclip
                      depth-based video compositing

================================================================================


    rcx05 is a video compositing system that overlays multiple videos in
    3D space using AI-extracted depth maps. on a pixel-by-pixel, frame-by-
    frame basis, the system shows whichever video is "closest" at that
    point—as if the videos were stacked in depth and you're seeing through
    to whatever's in front.

    the result: objects from different videos appear to coexist and pass
    through each other based on their actual spatial depth.

    example: two clips from a stationary camera at an intersection, shot
    at different times. cars from both clips appear simultaneously, driving
    "through" each other—each visible when it's the closest thing at those
    pixels.

    this is a demonstration of a video effect, with the goal of eventually
    becoming a plugin for video editing software.


================================================================================
                                  HOW IT WORKS
================================================================================


    THE CONCEPT
    ──────────────────────────────────────────────────────────────────────

        1. start with multiple video clips (ideally same camera angle)

        2. extract depth maps for each video using AI
           (currently via Runway.ai—local Python pipeline didn't work)

        3. play all videos simultaneously

        4. for each pixel, each frame:
           compare depth values across all videos
           show the pixel from whichever video has the closest depth

        5. result: videos composited as if they exist in the same 3D space


    COMPOSITION METHODS
    ──────────────────────────────────────────────────────────────────────

    the Processing prototype explores multiple approaches:

        FRONT-ONLY      show whichever video is closest at each pixel
                        (the default "noclip" effect)

        BACK-ONLY       show whichever video is furthest at each pixel
                        (inverse of front-only)

        THRESHOLD       user-controlled depth range—only show pixels
                        within a specific depth band

        SCANNING        animated depth threshold that cycles through
                        the depth range, revealing layers progressively


================================================================================
                                IMPLEMENTATIONS
================================================================================


    PROCESSING (prototype)
    ──────────────────────────────────────────────────────────────────────

    location: processing/rcx05noclip/ and processing/rcx05oct24renderer/

    a fuller prototype that demonstrates multiple composition methods.
    includes interactive threshold control, grid visualization of all
    methods simultaneously, and frame-by-frame recording.

    limitations:
        · inefficient—struggles with performance
        · hard-coded to low resolution
        · videos sometimes misaligned from depth maps by a few frames,
          causing edge artifacts and masking issues
        · requires pre-extracted depth map videos

    versions:
        v1 (rcx05noclip.pde)     archived/commented out
        v2 (rcx05noclip2.pde)    grid layout with recording
        v3 (rcx05noclip3.pde)    interactive thresholding
        v4 (rcx05oct24noclip.pde) synchronized playback, current version


    TOUCHDESIGNER (simplified)
    ──────────────────────────────────────────────────────────────────────

    location: touchdesigner/noclip.2.toe

    a simplified version implementing only the front-only method.
    uses a small handful of modules and can be:
        · run at any resolution
        · incorporated into other TouchDesigner patches
        · reused by others with clear instructions

    this is the cleaner, more practical implementation.


================================================================================
                                   WORKFLOW
================================================================================


    CURRENT PIPELINE
    ──────────────────────────────────────────────────────────────────────

        1. PREPARE VIDEOS
           gather clips you want to composite
           (same camera angle / similar framing works best)

        2. EXTRACT DEPTH MAPS
           upload each video to Runway.ai
           use their depth extraction tool
           download the depth map videos

        3. LOAD INTO SYSTEM
           Processing: place source videos + depth videos in expected paths
           TouchDesigner: load into the patch inputs

        4. RUN
           videos play simultaneously
           depth comparison happens per-pixel per-frame
           output shows the composited result


    IDEAL FUTURE PIPELINE
    ──────────────────────────────────────────────────────────────────────

        · local depth extraction (no Runway dependency)
        · plugin for After Effects / Premiere / etc.
        · real-time preview during editing
        · resolution-independent
        · frame-accurate alignment tools


================================================================================
                                    NOTES
================================================================================


    · the effect works best when videos share a camera angle or framing.
      different angles create chaotic/abstract results (which may also
      be interesting).

    · depth extraction quality matters. AI depth estimation isn't perfect—
      edges can be fuzzy, and fast motion can confuse the model.

    · frame alignment between source and depth videos is critical. even
      a few frames of drift causes visible edge artifacts.

    · "noclip" comes from the video game cheat that lets you pass through
      walls. here, objects from different videos pass through each other
      based on depth.

    · the Processing version is more of a research tool—demonstrating
      multiple methods. the TouchDesigner version is the practical one.


================================================================================
                                 FOLDER CONTENTS
================================================================================


    processing/
    ├── rcx05noclip/              # Processing prototype versions (v1-v4)
    ├── rcx05oct17renderer/       # older OSC-based renderer
    ├── rcx05oct20renderer/       # dual-window feedback system
    ├── rcx05oct24renderer/       # current depth compositor + depth_map.py
    ├── noclip_source/            # sample video assets
    ├── models/                   # depth estimation model (ONNX)
    └── [FastGAN files]           # unrelated GAN project, ignore

    touchdesigner/
    └── noclip.2.toe              # simplified front-only compositor


================================================================================
                                   STATUS
================================================================================


    ongoing.

    current state:
        · proof of concept works
        · TouchDesigner version is usable and shareable
        · Processing version is a research prototype
        · depth extraction requires external tool (Runway.ai)

    goal:
        · standalone effect/plugin for video editing software
        · automated depth extraction
        · production-ready quality and performance


                                    · · ·


    rcx05 asks: what if you could stack videos in depth and see through
    to whatever's in front? this is the experiment.


================================================================================

                                                                       ongoing

