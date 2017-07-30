// Define scales by semitone 0-11 (root is 0)
const scales = {
  major: [0, 2, 4, 5, 7, 9, 11],
  pentatonic: [0, 2, 4, 7, 9],
  wholetone: [0, 2, 4, 6, 8, 10],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
}

// Config options for scale & key
const selectedScale = 'major'
const initialNote = 24 // Set key. C is 0, 12, 24, 36... in different octaves

// Generate sequence of frequencies in an array.
// This allows for the mapping of simulation output values to quantized frequencies (musical scales)
const currentScale = []
for (let i = initialNote; i + 12 < frequencies.length; i+= 12) {
  for (let semitone = 0; semitone < 12; semitone += 1 ) {
    if (scales[selectedScale].includes(semitone)) {
      currentScale.push(frequencies[i + semitone])
    }
  }
}

/**
 * Define synthesizer voices
 * TODO - replace with proper synthesizer library?
 */
const Voice = class {
  constructor(type, initialGain, riseTime, riseConst, decayConst) {
    this.riseTime = riseTime
    this.riseConst = riseConst
    this.decayConst = decayConst

    this.context = new AudioContext()
    this.o = this.context.createOscillator()
    this.o.frequency.value = 523.3
    this.gain = this.context.createGain()
    this.masterGain = this.context.createGain()
    
    this.o.type = type
    this.masterGain.gain.value = initialGain

    this.o.connect(this.gain)
    this.gain.connect(this.masterGain)
    this.masterGain.connect(this.context.destination)

    this.lfo = this.context.createOscillator()
    this.lfo.frequency.value = 6
    this.lfoGain = this.context.createGain()
    this.lfoGain.gain.value = 2
    this.lfo.connect(this.lfoGain)
    this.lfoGain.connect(this.o.frequency)

    this.lfo.start()
    this.o.start()
  }

  newFrequency(frequency) {
    if (frequency < this.o.frequency.value + 0.5 && this.o.frequency.value - 0.5 < frequency) {
      return null
    }
    this.gain.gain.value = 0
    this.o.frequency.setValueAtTime(frequency, 0)
    this.gain.gain.setTargetAtTime(1, this.context.currentTime, 0.0001)
    this.gain.gain.setTargetAtTime(0, this.context.currentTime + this.riseTime, this.decayConst)
  }

  setGain(gain) {
    this.masterGain.gain.value = gain
  }
}

// Instantiate voice(s)
// constructor(type, initialGain, riseTime, riseConst, decayConst)
const voice1 = new Voice('sawtooth', 0.04, 2, 0.01, 0.3)
// const voice2 = new Voice('triangle', 0.02)
// const voice3 = new Voice('sawtooth', 0.1)
// const voice4 = new Voice('sawtooth', 0.1)



/**
 * React component to compute updates to the Web Audio API.
 * This runs once every generation
*/
const UpdateSounds = ({ board, generation }) => {

  /* populate boardInfo with analyzed output */
  // const data = {
  //   height: ROWS,
  //   width: COLS,
  //   zero: {
  //   },
  // }
  /**
   * 0 dimensional measures - activeTotal,
   */

  // Only update once every 4 generations (possibly remove)
  if (generation % 4 !== 0) return null

  let activeTotal = 0
  let y, x // y = vertical position, x = horizontal position
  // Iterate across rows, each row scanning left to right.
  // Each value is 0 for dead, or 1-7 for age (7 is oldest)
  for (y = 0; y < ROWS; y++) {
    for (x = 0; x < COLS; x++) {
      // Count of active cells (age 1-7)
      if (board[y][x] > 0 && board[y][x] !== 7) {
        activeTotal += 1
      }
    }
  }

  /**
   * Mappings from derived simulation data to Voice method calls
   */
  const activeTotalToNote = d3.scaleQuantize()
    .domain([0, Math.sqrt(ROWS * COLS)])
    .range(currentScale)

  // let freqMax = noteValues['C7']
  // let freqMin = noteValues['C2']
  // let frequency2 = factor1 * (freqMax - freqMin) + freqMin

  // Modify audio voices
  voice1.newFrequency(activeTotalToNote(Math.sqrt(activeTotal)))
  // voice2.newFrequency(frequency2)
  // voice2.newFrequency(frequency1 * 1.25992)
  // voice2.newFrequency(frequency1 * 1.49831)
  // voice2.newFrequency(frequency1 * 2)

  // Don't actually render anything to the DOM
  return null
}
const mapStateToUpdateSoundsProps = ({ board, generation }) => ({ board, generation })
const UpdateSoundsContainer = connect(mapStateToUpdateSoundsProps)(UpdateSounds)


// const context = new AudioContext()
// const o = context.createOscillator()
// o.type = 'sawtooth'
// const gain = context.createGain()
// const masterGain = context.createGain()
// o.connect(gain)
// gain.connect(masterGain)
// masterGain.gain.value = 0
// masterGain.connect(context.destination)

// const lfo = context.createOscillator()
// lfo.frequency.value = 6
// const lfoGain = context.createGain()
// lfoGain.gain.value = 2
// lfo.connect(lfoGain)
// lfoGain.connect(o.frequency)

// lfo.start()
// o.start()


// const soundStart = () => {
//   masterGain.gain.linearRampToValueAtTime(
//     0.2,
//     context.currentTime + 0.1
//   )
// }

// const soundNote = (frequency, rampTime) => {
//   // o.frequency.value = frequency
//   o.frequency.setValueAtTime(frequency, context.currentTime)
//   // masterGain.gain.linearRampToValueAtTime(
//   //   0.2,
//   //   context.currentTime + rampTime
//   // )
//   // masterGain.gain.setValueAtTime(0.2, 0)
//   masterGain.gain.value = 0.2
//   masterGain.gain.linearRampToValueAtTime(
//     0.00001,
//     context.currentTime + rampTime
//   )
// }

// const soundStop = () => {
//   masterGain.gain.exponentialRampToValueAtTime(
//     0.00001,
//     context.currentTime + 0.1
//   )
// }

