## Music of Life - Generate music from cellular automata
Paul Hoskinson (plhosk@gmail.com)

Try it at [https://music-of-life.surge.sh](https://music-of-life.surge.sh). Warning, this app outputs sound.

This is a demo using the Web Audio API to generate sounds from a Game of Life cellular automaton.

The basic idea is to analyze the 2D plane of the cellular automaton as it evolves and convert this information to commands to be sent to a sound synthesizer. 

### Interface

Pause - Stop computing new generations
Start - While paused, click to resume simulation
Advance - While paused, you can advance 1 generation at a time
Randomize - Erase the board and fill with new cells at 0.37 density
Clear - Kill every cell on the board

Whenever the simulation is running, the program will generate audio.

There are many options that are only available by editing the source code:
- Board size
- Time interval between generations
- Audio synthesizer configuration

### Development

- `git clone https://github.com/plhosk/music-of-life.git`
- `cd music-of-life`
- `npm install`
- `npm start` (starts dev server on localhost:3000)
- `npm build` (creates optimized production build)

### Deriving data from the Game of Life

There are many ways to analyze the 2D simulation (see discussion below) but for simplicity, my implementation analyzes only two measures:
- Total active cell count ("active" meaning age is between 1 and 6)
- Average age of active cells

In addition, the above measures are also performed on subsets of the full board. The board is divided into vertical sections similar to a piano keyboard, and the activity of cells is measured in each section.

### Contolling audio synthesizers

For the synthesizers I tried a few different ideas and settled on the following:

- Bass line
  - Pitch is controlled by the total active cell count (tends to start high and decrease over time)
  - Volume is constant
  - Updated every 8 generations
  - Only plays a note if it's different than the previous note
- The constant hum that morphs over time
  - The board is divided into narrow vertical "keys" like a piano keyboard (left side = low pitch, right side = high pitch)
  - The volume of each note is determined by the cell activity in each section
  - Updated every generation
- Most active key
  - As above, except only the most active section at any particular time plays a sound
  - Volume is constant
  - Updated every 4 generations
- Age-controlled voice
  - Pitch is controlled by the average age of active cells (this fluctuates between 1 and 6)
  - Volume is constant
  - Updated every 4 generations
- Drum
  - Produces a click sound every 16 generations
  - Shuts off if the concentration of active cells drops below a certain value

Also the musical scales for each voice are predefined, and the musical key changes randomly between defined possiblities every 192 generations.

In other words there's a lot of artistic license in making the music sound good. The game of life simulation doesn't magically produce beautiful music without somebody making it do so.

I guess you could think of this implementation as like a guided music box - the music is influenced by the simulation, but not entirely defined by it.

### Further possibilities

There are many improvements that could be made: 
- Visual feedback of synthesizer sounds
- Volume control
- Selectable configuration presets
- UI for customizing instruments
- More forms of analysis of the game board
- Bring in a third-party synthesizer library for more customization

---

### Some thoughts

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

The simplest approach would be to attempt to distill the "true essence" of the simulation, feeding raw data directly the synthesizer with minimal modification, perhaps nothing further than a simple scaling factor. The problem is that it simply doesn't sound pleasing to the ear.

On the other end of the spectrum, there is no limit to the complexity of possible filters, signal mapping and computation, only the composer's creativity, musical ability and effort.

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

Connect output generators on 1 side with synthesizers on other side

**Output generators:**
- any from above list. Need to distill the best signals
- Have good presets as default or selectable

**Mapping stage:**
- Clamp signal
- Invert
- Exp/Log

**Synthesizer**
- Master gain slider
- Oscillator type (sine, triangle, square, sawtooth)
- Scale dropdown (continuous, chromatic, major, pentatonic) + key dropdown
- Envelope presets
- Controllable filter presets
- Rhythm control?

Maybe just have only presets able to be selected in UI to massively simplify UI. Add new presets with js
