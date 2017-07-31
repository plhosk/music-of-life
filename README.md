This is a demo using the Web Audio API to generate sounds from a Game of Life cellular automaton.

The basic idea is to analyze the 2D plane of the cellular automaton as it evolves and convert this information to commands to be sent to a sound synthesizer. 

Possible forms of signal analysis to derive information from the continuously changing 2D plane:

- Count of live cells (in entire plane or a certain region)
  - Can filter old cells (age > 7 or  perhaps higher) to detect degenerate forms
  - Tends to decrease over time until halting state
- Average age of live cells in area (up to a certain limit)
- Ratio of degenerate cells to active cells
- Number of cells created or destroyed
- Divide the plane into a grid and map properties of each grid area to a 2D array
  - Any of above measurements except restricted to single grid cell (concentration, average age, etc)
- Map each cell to an instrument
  - 3 dimensions of control: column, row, age
  - Control pitch, note length, timbre, percussion
- scan across the plane
  - Simulation either paused during scan or advancing for each new column
  - Update sounds continuously or step-wise, based on 1D, 2D or 3D arrays
- Analyze changes over time
  - deeper analysis, running averages, etc

The myriad combinations of variables and tuning of signal paths results in a tremendous amount of possibilities. What should guide the selection?

The simplest approach would be to attempt to distill the "true essence" of the simulation, feeding raw data directly the synthesizer with minimal modification, perhaps nothing further than a simple scaling factor. On the other end, there is no limit to the complexity of possible filters, signal mapping and computation, only the composer's creativity, musical ability and effort.

What configuration would work for an interactive synthesizer? Controls should be easy to use, yet responsive and deep. Multiple voices could be added and customized quickly to build an ensemble.

Web controls can include 1D sliders, 2D touchpanels, quantized radio buttons/checkboxes/dropdown selectors

Voice controls:
- Instrument (oscillator type, .wav file, audio stream...)
- Frequency (oscillator output or audio frequency shift)
- Gain (volume)
- Envelope (ramp speed, sustain)
- Vibrato
- Audio filter (phase, low pass, high pass, band pass) - filter parameters can be controlled
- Rhythm (constant tone vs repeated notes vs intermittent, when to initiate note, when to stop)

Possible control configurations: 

All voices:
- Master gain slider

**Synthesizer**
- Master gain slider
