
================================================================================

                                   r c x 0 1
                              dynamic loop sampler

================================================================================


    rcx01 is a loop sampler built for real-time exploration and manipulation.
    it combines a Processing front-end with a SuperCollider audio engine,
    connected via OSC. tempo is controlled through ship physics rather than
    a slider. samples are organized across two axes. everything is keyboard-
    driven and designed to reward intuition over manual precision.

    the instrument is built around the idea that parameters like tempo and
    sample selection can be terrain to move through rather than values to set.
    it's useful for solo beatmaking, live performance, or jamming with others
    who may not have experience with traditional production tools—the controls
    are immediate enough that someone unfamiliar with DAWs can still be at the
    wheel of the beat.


================================================================================
                                  ARCHITECTURE
================================================================================


    ┌─────────────────────┐          OSC           ┌─────────────────────────┐
    │                     │  ──────────────────▶   │                         │
    │  Processing (pde/)  │                        │  SuperCollider (.scd)   │
    │                     │                        │                         │
    │  - UI rendering     │   /bpm, /dex, /rev,    │  - audio playback       │
    │  - keyboard input   │   /jump, /rec, etc.    │  - recording            │
    │  - ship physics     │                        │  - effects              │
    │  - visual feedback  │                        │  - deck management      │
    │                     │  ◀──────────────────   │                         │
    └─────────────────────┘    waveform data       └─────────────────────────┘

    the two programs run independently and communicate over localhost.
    Processing handles all visuals and input; SuperCollider handles all audio.


================================================================================
                                   THE ENGINE
================================================================================


    DECKS & BUFFERS
    ──────────────────────────────────────────────────────────────────────────

    audio is organized into Decks. each Deck holds 4 interchangeable buffers—
    think of them as 4 variations of the same musical idea. there are 8 Decks
    total: the first 4 are assigned to the X-axis sampler, the next 4 to the
    Y-axis sampler.

        Deck 0 ──▶ [ buf0 | buf1 | buf2 | buf3 ]  ─┐
        Deck 1 ──▶ [ buf0 | buf1 | buf2 | buf3 ]   │  X-axis
        Deck 2 ──▶ [ buf0 | buf1 | buf2 | buf3 ]   │  samplers
        Deck 3 ──▶ [ buf0 | buf1 | buf2 | buf3 ]  ─┘

        Deck 4 ──▶ [ buf0 | buf1 | buf2 | buf3 ]  ─┐
        Deck 5 ──▶ [ buf0 | buf1 | buf2 | buf3 ]   │  Y-axis
        Deck 6 ──▶ [ buf0 | buf1 | buf2 | buf3 ]   │  samplers
        Deck 7 ──▶ [ buf0 | buf1 | buf2 | buf3 ]  ─┘

    each Deck also contains N-buffers: 4x4 grids of NMF-decomposed audio
    components (via FluCoMa), allowing spectral layers to be mixed and
    isolated during playback.


    PHASOR-DRIVEN PLAYBACK
    ──────────────────────────────────────────────────────────────────────────

    a global phasor runs continuously, synced to the current BPM. this phasor
    (ranging 0–4, representing 4 beats) drives all sample playback. every
    sampler reads its buffer position from this phasor, so all loops stay
    locked together regardless of which buffers are active.

        globalPhasor (0–4)
              │
              ├──▶ X-sampler ──▶ reads from active X-deck buffer
              │
              └──▶ Y-sampler ──▶ reads from active Y-deck buffer

    because playback is phasor-driven rather than trigger-driven, switching
    buffers mid-loop is seamless—the new buffer picks up at the same phase
    position.


    WHY THE SOUND SOUNDS THE WAY IT DOES
    ──────────────────────────────────────────────────────────────────────────

    several factors shape the output:

    1. dual-axis mixing: X and Y samplers run simultaneously, so you're
       always hearing at least two loops layered together

    2. NMF decomposition: the N-buffers are spectral components of the
       original audio, ordered by centroid similarity. mixing these
       creates variations that preserve harmonic relationships

    3. tempo via physics: because tempo is controlled by ship velocity
       and position (not a fixed value), it drifts and fluctuates
       organically during performance

    4. jump points: jumping to stored phasor positions creates rhythmic
       interruptions and phrase resets

    5. reverse toggles: reversing an axis flips the phasor direction for
       that sampler only, creating polyrhythmic/contrary motion effects


================================================================================
                                   INTERFACE
================================================================================


    WINDOW LAYOUT (800 x 800)
    ──────────────────────────────────────────────────────────────────────────

        ┌───────────────────────┬───────────────────────┐
        │                       │                       │
        │      SHIP AREA        │   WAVEFORM (X-axis)   │
        │                       │                       │
        │   · pilot the ship    │   · amplitude viz     │
        │   · trails appear     │   · red playhead      │
        │     as you move       │                       │
        │                       │                       │
        ├───────────────────────┼───────────────────────┤
        │                       │                       │
        │      MATRIX VIEW      │   WAVEFORM (Y-axis)   │
        │                       │                       │
        │   · 4x4 grid viz      │   · amplitude viz     │
        │   · shows active      │   · blue playhead     │
        │     deck/buffer       │                       │
        │     selections        │                       │
        │                       │                       │
        └───────────────────────┴───────────────────────┘


================================================================================
                                   CONTROLS
================================================================================


    SHIP / TEMPO
    ──────────────────────────────────────────────────────────────────────────

        ↑           thrust forward (accelerate in facing direction)
        ←  →        rotate ship left/right
        SPACE       brake (kill velocity)
        SHIFT+SPACE hold position (pause movement, resume on release)

    tempo is derived from the ship's position on the 2D plane. moving the
    ship changes the BPM continuously. the relationship is non-linear—
    explore to find the tempo zones.


    MAIN MATRIX (deck/buffer selection)
    ──────────────────────────────────────────────────────────────────────────

    the left half of the keyboard maps to a 4x4 grid:

        1  2  3  4          column 0   column 1   column 2   column 3
        Q  W  E  R    ──▶   row 0      row 0      row 0      row 0
        A  S  D  F          row 1      row 1      row 1      row 1
        Z  X  C  V          row 2      row 2      row 2      row 2
                            row 3      row 3      row 3      row 3

        · columns select which Deck is active for that slot
        · rows select which buffer (0–3) within the Deck

    the current selection is shown as filled squares in the matrix view.


    ALT MATRIX (jump points)
    ──────────────────────────────────────────────────────────────────────────

    the right half of the keyboard maps to 16 jump point slots:

        5  6  7  8          jump 0    jump 1    jump 2    jump 3
        T  Y  U  I    ──▶   jump 4    jump 5    jump 6    jump 7
        G  H  J  K          jump 8    jump 9    jump 10   jump 11
        B  N  M  ,          jump 12   jump 13   jump 14   jump 15

    jump points store a phasor position. when triggered, playback snaps
    to that position. each jump stores X and Y positions independently.

        to SET a jump:    hold a jump key, then press a matrix key
        to TRIGGER:       tap the jump key
        to DELETE:        hold DELETE, then press the jump key


    RECORDING
    ──────────────────────────────────────────────────────────────────────────

        TAB (hold)    enter recording mode (matrix keys become rec slots)
        ENTER         prime recording / confirm recording

    while holding TAB, pressing a matrix key selects that recording slot.
    recordings sync to the nearest loop boundary automatically. recorded
    audio can be played back like any other buffer.


    EFFECTS
    ──────────────────────────────────────────────────────────────────────────

        [           toggle X-axis reverse
        ]           toggle Y-axis reverse
        - (minus)   mute toggle
        = (plus)    unmute toggle


    MODIFIER NOTES
    ──────────────────────────────────────────────────────────────────────────

        · SHIFT modifies certain matrix selections (shown as checkered)
        · DELETE + jump key removes that jump point
        · TAB switches the main matrix to recording slot selection


================================================================================
                                   FEATURES
================================================================================


    PHYSICS-BASED TEMPO
    ──────────────────────────────────────────────────────────────────────────

    the ship obeys simple physics: thrust adds velocity, friction decays it,
    position wraps at screen edges. tempo is calculated from position, so
    piloting the ship is how you control BPM. this replaces the traditional
    tempo slider with something more gestural and improvisatory.

    trails are left behind as you move, creating a visual record of your
    tempo performance. brightness indicates velocity.


    DUAL-AXIS SAMPLERS
    ──────────────────────────────────────────────────────────────────────────

    X and Y samplers run in parallel, each with their own deck assignments.
    this means you're always layering two sample streams. reversing one axis
    while the other plays forward creates contrary motion effects.


    JUMP POINTS
    ──────────────────────────────────────────────────────────────────────────

    16 storable positions in the loop. set them on the fly, trigger them to
    snap playback to that moment. useful for creating stutter effects, phrase
    resets, or navigating to specific sections of a loop quickly.


    LIVE RECORDING
    ──────────────────────────────────────────────────────────────────────────

    16 recording slots. recordings sync to the loop boundary, so even if you
    start recording mid-phrase, playback will align correctly. record vocals,
    external instruments, or feedback from the output.


    NMF DECOMPOSITION
    ──────────────────────────────────────────────────────────────────────────

    samples are pre-processed with Non-negative Matrix Factorization via
    FluCoMa. this separates audio into spectral components (stored as
    N-buffers), which can be mixed during playback for timbral variation
    without losing harmonic coherence.


================================================================================
                                 INSTALLATION
================================================================================


    REQUIREMENTS
    ──────────────────────────────────────────────────────────────────────────

        · Processing 4.x with oscP5 library
        · SuperCollider 3.13+
        · FluCoMa (Fluid Corpus Manipulation) for audio preprocessing
        · macOS (launcher script is .command)


    SETUP
    ──────────────────────────────────────────────────────────────────────────

        1. install rcxDeck.sc to your SuperCollider Extensions folder:
           copy install/extensions/rcxDeck.sc to:
           ~/Library/Application Support/SuperCollider/Extensions/

        2. recompile SuperCollider class library (Language > Recompile)

        3. open rxc01nov24.scd in SuperCollider and evaluate the setup blocks

        4. open pde/rcx01main.pde in Processing and run the sketch

        5. alternatively, use Run-rcx01.command to launch both together


    AUDIO SETUP
    ──────────────────────────────────────────────────────────────────────────

    samples should be organized in the a_chops_cmr/ directory structure,
    with X/ and Y/ subdirectories containing the axis-separated audio,
    and N/ subdirectories containing NMF-decomposed components.

    the FluCoMa toolkit is used to generate these decompositions from
    source audio.


================================================================================
                                    NOTES
================================================================================


    · session logs are saved to pde/pde-txt/data/logs/ for later review
    · waveform data is exchanged via CSV files in the data directory
    · all timing is derived from the global phasor—loops stay in sync
      even when switching buffers, changing tempo, or jumping


                                    · · ·


    rcx01 is an instrument for exploring sample space through movement
    and gesture. it's meant to be played, not just operated.


================================================================================

                                                                         v.2024

