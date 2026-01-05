
================================================================================

                                   r c x 0 2
            recursive real-time youtube worm  /  0-view slop installation

================================================================================


    rcx02 is a self-feeding video installation that watches itself watching
    YouTube. it uses OCR to read text from its own display, searches YouTube
    for short videos matching those words, downloads them, and plays them
    back—where they get read again, continuing the loop indefinitely.

    the result is a live window into whatever is actually being uploaded to
    YouTube in real-time: 0-view videos, global content drift, algorithmic
    noise, and the endless stream of media that exists whether anyone sees
    it or not.

    first installed at Columbia College Chicago Manifest 2024.


================================================================================
                              PHYSICAL INSTALLATION
================================================================================


    the piece is built around a feedback loop made physical:

        ┌─────────────────────────────────────────────────────────────────┐
        │                                                                 │
        │                         [ WIDESCREEN TV ]                       │
        │                                                                 │
        │      ┌──────────┐                                               │
        │      │ gramCam  │  ← webcam on top of TV, pointed DOWN          │
        │      └────┬─────┘    at the desk surface                        │
        │           │                                                     │
        │           ▼                                                     │
        │   ┌───────────────┐                                             │
        │   │  BANANAGRAMS  │  ← letter tiles on desk, audience can       │
        │   │   on desk     │    rearrange to steer the loop              │
        │   └───────────────┘                                             │
        │                                                                 │
        │           ┌─────────────────┐                                   │
        │           │   WOODEN CHAIR  │                                   │
        │           │   with stick    │  ← branch duct-taped to back      │
        │           │   spine + head  │    as spine, styrofoam head       │
        │           │                 │    on top                         │
        │           │    ◉  ◉  ←──────│── webcam pressed into eye         │
        │           │                 │   sockets, pointed at TV          │
        │           └─────────────────┘                                   │
        │                  │                                              │
        │                  │                                              │
        │                  ▼                                              │
        │         [ VIDEO FEED = CANVAS BACKGROUND ]                      │
        │         creates infinite feedback behind                        │
        │         the video overlays                                      │
        │                                                                 │
        └─────────────────────────────────────────────────────────────────┘

    the styrofoam figure watches the TV. what it sees becomes the background.
    the bananagrams on the desk are the audience's input mechanism—rearrange
    the letters, steer the worm.


================================================================================
                                  HOW IT WORKS
================================================================================


    THE LOOP
    ──────────────────────────────────────────────────────────────────────

        1. camera captures the current display (TV showing videos + feedback)

        2. frame is sent to Python backend running Keras-OCR

        3. OCR detects text in the frame (from videos, bananagrams, anything)

        4. detected words become YouTube search queries
           · randomized word combinations
           · tries multiple query permutations

        5. system finds a short video (<60 seconds) matching the query
           · filters out already-played videos
           · prioritizes fresh, often 0-view content

        6. video is downloaded, scaled, and added to the playback queue

        7. video plays on screen, overlaid via background subtraction
           · only foreground/moving elements are shown
           · static backgrounds become transparent

        8. the new video contains new text → loop continues

                    ┌────────────────────────────────┐
                    │                                │
                    ▼                                │
                 DISPLAY ──▶ OCR ──▶ SEARCH ──▶ DOWNLOAD
                    ▲                                │
                    │                                │
                    └───────── PLAYBACK ◀────────────┘


    THE GRAM LAYER
    ──────────────────────────────────────────────────────────────────────

    the second webcam (gramCam) watches the desk from above. it captures
    the bananagram tiles, runs background subtraction to isolate just the
    letters, and composites them into the display alongside the videos.

    the gram layer gets OCR'd along with everything else—no special
    treatment. it just becomes part of the text soup that feeds the loop.
    this is how the audience steers: spell something, and the worm will
    eventually find it.


    GLOBAL DRIFT
    ──────────────────────────────────────────────────────────────────────

    because the system pulls from whatever is being uploaded to YouTube
    in real-time, it naturally drifts through global content based on
    time zones. when it's noon in India, the feed trends Indian. a few
    hours later, Chinese. the installation becomes a kind of clock,
    tracking the sun through the linguistic geography of YouTube uploads.


================================================================================
                                 ARCHITECTURE
================================================================================


    ┌─────────────────────┐           OSC            ┌──────────────────────┐
    │                     │  ───────────────────▶    │                      │
    │  Processing (pde/)  │                          │  Python (eyeDog.py)  │
    │                     │    /sendScan (frame)     │                      │
    │  - display render   │    /sendGram (gram)      │  - Keras-OCR         │
    │  - camera capture   │                          │  - YouTube search    │
    │  - video playback   │  ◀───────────────────    │  - yt-dlp download   │
    │  - background sub   │    /returnScan (boxes)   │  - FFmpeg scaling    │
    │                     │    /requestScan (next)   │                      │
    └─────────────────────┘                          └──────────────────────┘

    Processing runs the display and captures frames every ~1.5 seconds.
    Python handles OCR, searches YouTube, and manages downloads.
    videos are saved to data/movies/ and auto-loaded when ready.


    FILE STRUCTURE
    ──────────────────────────────────────────────────────────────────────

        rcx02/
        ├── rcx02may4/
        │   ├── rcx02pde/                 # Processing sketch
        │   │   ├── rcx02main.pde         # main loop, video playback
        │   │   ├── rcx02cam.pde          # camera handling, OCR viz
        │   │   ├── rcx02osc.pde          # OSC communication
        │   │   ├── rcx02input.pde        # input handlers
        │   │   └── data/
        │   │       ├── frames/           # captured frames for OCR
        │   │       ├── movies/           # downloaded videos
        │   │       └── grams/            # gram masks
        │   │
        │   ├── eyeDog.py                 # OCR + download coordinator
        │   ├── scraperDog.py             # YouTube search logic
        │   └── printerDog.py             # (unused) printer module
        │
        └── media/                        # documentation


================================================================================
                                VIDEO PROCESSING
================================================================================


    SEARCH STRATEGY
    ──────────────────────────────────────────────────────────────────────

    when OCR returns detected words, the system builds search queries by
    randomly combining subsets of those words. it tries up to 10 different
    query permutations before giving up:

        detected: ["cat", "jumping", "water"]

        tries:    "jumping"
                  "cat water"
                  "jumping cat"
                  "water"
                  ...

    first match under 60 seconds that hasn't been played before gets
    downloaded.


    DOWNLOAD + SCALING
    ──────────────────────────────────────────────────────────────────────

    videos are downloaded via yt-dlp, then scaled with FFmpeg to match
    the display resolution. only files with "scaled" in the filename are
    loaded by Processing—this prevents half-downloaded files from playing.


    BACKGROUND SUBTRACTION
    ──────────────────────────────────────────────────────────────────────

    each video is processed through OpenCV background subtraction:

        · static backgrounds are learned and removed
        · only moving foreground elements are displayed
        · masks are dilated to clean up edges

    this means videos layer transparently over each other and over the
    feedback background. up to 2 videos play simultaneously.


    AUDIO
    ──────────────────────────────────────────────────────────────────────

    audio comes directly from the videos, in sync with playback. when
    multiple videos overlap, their audio overlaps. there's no additional
    sound processing—what you hear is what YouTube gave.


================================================================================
                                 REQUIREMENTS
================================================================================


    HARDWARE
    ──────────────────────────────────────────────────────────────────────

        · 2 webcams (tested with Logitech HD Pro C920 + C270)
        · display/TV
        · for full installation: desk, chair, stick, styrofoam head,
          bananagrams, duct tape


    SOFTWARE
    ──────────────────────────────────────────────────────────────────────

        Processing 4.x
            · gab.opencv
            · processing.video
            · oscP5 / netP5

        Python 3.10+
            · keras-ocr
            · opencv-python
            · youtube-search-python
            · yt-dlp
            · python-osc

        System
            · FFmpeg


================================================================================
                                    NOTES
================================================================================


    · the 60-second filter keeps the loop moving—longer videos would stall
      the drift. it's not exclusively Shorts/TikToks, just short content.

    · the worm tends to find slop: AI-generated content, test uploads,
      screen recordings, surveillance footage, things with text overlays.
      this is what's actually being uploaded constantly.

    · language drift follows the sun. set it up for a day and watch it
      cycle through the world's upload patterns.

    · the bananagrams are optional but recommended. without audience input,
      the loop will wander wherever the text takes it. with input, you can
      nudge it toward specific territories.


                                    · · ·


    rcx02 is a worm that eats text and excretes video. it lives in the
    space between upload and view, surfacing content that would otherwise
    exist unseen. let it run long enough and it'll show you what the
    internet is actually doing when no one's watching.


================================================================================

                                                              manifest 2024

