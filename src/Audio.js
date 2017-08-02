// don't need to import React because no JSX is used
// import React from 'react'
import { connect } from 'react-redux'
import { scaleQuantize } from 'd3-scale'

import frequencies from './frequencies.js'
import { ROWS, COLS } from './App.js'

/**
 * Initialize audio synthesizer
 */

// Define scales by semitone 0-11 (root is 0)
const scaleDefinitions = {
  major: [0, 2, 4, 5, 7, 9, 11],
  pentatonic: [0, 2, 4, 7, 9],
  wholetone: [0, 2, 4, 6, 8, 10],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  chordMinor: [0, 3, 7],
  chordMajor: [0, 4, 7],
  chordMajor7: [0, 4, 7, 11],
  chordMajorFlat7: [0, 4, 7, 10],
}

// Calculate frequencies of each scale
const scales = {}
for (let key = 0; key < 12; key += 1) {
  scales[key] = {}
  for (let scaleType in scaleDefinitions) {
    if (!scaleDefinitions.hasOwnProperty(scaleType)) continue
    // Generate sequence of frequencies in an array.
    // This allows for the mapping of simulation output values to quantized frequencies (musical scales)
    scales[key][scaleType] = []
    for (let i = key; i < frequencies.length; i+= 12) {
      for (let semitone = 0; semitone < 12; semitone += 1 ) {
        if (i + semitone > frequencies.length) continue
        if (scaleDefinitions[scaleType].includes(semitone)) {
          scales[key][scaleType].push(frequencies[i + semitone])
        }
      }
    }
  }
}

/**
 * Define synthesizer voices using Web Audio API
 * TODO - replace with proper synthesizer library?
 */

const context = new AudioContext()
const overallVolume = context.createGain()
overallVolume.gain.value = 1
const merger = context.createChannelMerger(1)
merger.connect(overallVolume)
overallVolume.connect(context.destination)

// Each musical voice is an instantiation of the Voice class
const Voice = class {
  constructor(type, repeat, initialGain, lfoGain, lfoFreq, riseTime, riseConst) {
    this.riseTime = riseTime
    this.riseConst = riseConst

    this.o = context.createOscillator()
    this.o.frequency.value = 1
    this.gain = context.createGain()
    this.masterGain = context.createGain()
    // this.biquad = context.createBiquadFilter()
    // this.biquad.type = 'bandpass'
    // this.biquad.Q.value = 0
    
    this.o.type = type
    this.repeat = repeat
    this.masterGain.gain.value = initialGain

    // this.o.connect(this.biquad)
    // this.biquad.connect(this.gain)
    this.o.connect(this.gain)
    this.gain.connect(this.masterGain)
    this.masterGain.connect(merger)

    this.lfo = context.createOscillator()
    this.lfo.frequency.value = lfoFreq
    this.lfoGain = context.createGain()
    this.lfoGain.gain.value = lfoGain
    this.lfo.connect(this.lfoGain)
    this.lfoGain.connect(this.o.frequency)

    this.lfo.start()
    this.o.start()
  }

  playNote(frequency, decayConst) {
    if (!this.repeat && frequency < this.o.frequency.value + 0.5 && this.o.frequency.value - 0.5 < frequency) {
      return null
    }
    this.gain.gain.value = 0
    this.o.frequency.setValueAtTime(frequency, 0)
    this.gain.gain.setTargetAtTime(1, context.currentTime, 0.0001)
    this.gain.gain.setTargetAtTime(0, context.currentTime + this.riseTime, decayConst)
  }

  setGain(gain) {
    this.masterGain.gain.value = gain
  }

  // setBiquadQ(q) {
  //   this.biquad.Q.value = q
  // }
  // setBiquadFrequency(frequency) {
  //   console.log(frequency)
  //   this.biquad.frequency.value = frequency
  // }
}

// Calculate scales based on selected preferences
let semitoneOffset = 0
let currentScale = []
let bassScale = []
let ageScale = []
const calculateScales = (semitoneOffset) => {
  currentScale = scales[semitoneOffset.toString()].major.slice(18, -7)
  // const currentScale = scales['0'].chordMajor.slice(6, -6)
  // const bassScale = scales['0'].major.slice(7, -24)
  bassScale = scales[semitoneOffset.toString()].pentatonic.slice(8, -10)
  ageScale = scales[semitoneOffset.toString()].major.slice(12, -12)
  // const currentScale = scales['0'].wholetone.slice(12, -6)
  // const currentScale = scales['0'].chromatic.slice(12, -12)
}

calculateScales(semitoneOffset)

let columnKeyboardVolume = 0
let columnKeyboardFullVolumeGeneration = 100
const calculateMixGainFactor = () => {
  return 1 / currentScale.length * columnKeyboardVolume
}
let mixGainFactor = calculateMixGainFactor()

let decayConst = 1

// Instantiate voice(s)
// constructor(type, repeat, initialGain, lfoGain, lfoFreq, riseTime, riseConst)

// 1 voice for each note of scale
const columnKeyboard = []
for (let i = 0; i < currentScale.length; i += 1) {
  columnKeyboard[i] = new Voice('sawtooth', true, 0, 1, 6, 0.01, 0.05)
}

// 1 voice follows the most active column area
const brightestRange = 1
const brightestVoices = []
for (let i = 0; i < brightestRange; i += 1) {
  brightestVoices[i] = new Voice('triangle', false, 0.03, 1, 6, 0.01, 0.05)
}


const bassLine = new Voice('square', false, 0.04, 3, 8, 0.01, 0.001) // 0.03
const ageVoice = new Voice('square', false, 0.01, 2, 6, 0.01, 0.001) // 0.015

const drum1 = new Voice('square', true, 0.06, 0, 6, 0.01, 0.001) // 0.06

// Functions for analyzing board. active cells, average age
// Iterate across every cell on the board
const iterateAllCells = (board) => {
  let activeTotal = 0
  let sumOfActiveAges = 0
  let y, x // y = vertical position, x = horizontal position
  // Iterate across rows, each row scanning left to right.
  // Each value is 0 for dead, or 1-7 for age (7 is oldest)
  for (y = 0; y < ROWS; y++) {
    for (x = 0; x < COLS; x++) {
      // Count of active cells (age 1-6)
      if (board[y][x] > 0 && board[y][x] !== 7) {
      // if (board[y][x] > 0) {
        activeTotal += 1
        sumOfActiveAges += board[y][x]
      }
    }
  }
  return [
    activeTotal,
    activeTotal === 0 ? 0 : sumOfActiveAges / activeTotal,
  ]
}

// Iterate along a specified column
const iterateCol = (board, col) => {
  let activeCellsInCol = 0
  let sumOfActiveAges = 0
  for (let row = 0; row < ROWS; row += 1) {
    if (board[row][col] > 0 && board[row][col] !== 7) {
      activeCellsInCol += 1
      sumOfActiveAges += board[row][col]
    }
  }
  return [
    activeCellsInCol,
    activeCellsInCol === 0 ? 0 : sumOfActiveAges / activeCellsInCol,
  ]
}


/**
 * React component to compute updates to the Web Audio API.
 * This is called once every generation
 * (i.e. whenever "board" and "generation" variables change)
*/
const UpdateSounds = ({ board, generation }) => {

  // Ramp up columnKeyboard volume over first 100 generations
  // otherwise it's too loud
  columnKeyboardVolume = generation > columnKeyboardFullVolumeGeneration ? 1 : generation / columnKeyboardFullVolumeGeneration
  mixGainFactor = calculateMixGainFactor()

  // Analyze board
  const [allActiveCount, allActiveAgeAverage] = iterateAllCells(board)

  // Shorten note length if the number of active cells is low
  decayConst = Math.sqrt(allActiveCount / (ROWS * COLS))

  // Change root key every so often
  if (generation !== 0 && generation % 192 === 0) {
    let offsetList = [0, 2, 4, 6, 8]
    semitoneOffset = offsetList[Math.floor(Math.random() * offsetList.length)]
    calculateScales(semitoneOffset)
  }

  // Every generation, update the columnKekyboard and brightestVoices
  if (generation % 1 === 0) {
    // Map scale notes to columns (works best with scale.length <= COLS)
    const keyActiveTotals = {}
    for (let note = 0; note < currentScale.length; note += 1) {
      let sumOfActiveCellsAvg = 0
      let numCols = 0
      for (let col = Math.floor(note / currentScale.length * COLS);
        col < COLS && col < Math.floor((note + 1) / currentScale.length * COLS);
        col += 1) {
        const [activeCells] = iterateCol(board, col)
        numCols += 1
        sumOfActiveCellsAvg += activeCells / ROWS
      }
      let adjustedGain = sumOfActiveCellsAvg / numCols
      keyActiveTotals[note] = sumOfActiveCellsAvg / numCols
      adjustedGain = Math.log(adjustedGain + 1) / 0.6931471805599453
      columnKeyboard[note].setGain(adjustedGain * mixGainFactor)
      columnKeyboard[note].playNote(currentScale[note], 0.5)
    }

    // analyze brightest note every 4 generations
    if (generation % 4 === 0) {
      const keyActiveSorted = Object.keys(keyActiveTotals)
      keyActiveSorted.sort((a,b) => keyActiveTotals[b] - keyActiveTotals[a])
      for (let i = 0; i < brightestRange; i += 1) {
        brightestVoices[i].playNote(currentScale[keyActiveSorted[i]], decayConst)
      }
    }
  }

  // Bass Line
  // fraction of active cells
  if (generation % 8 === 0) {
    const noteScale = scaleQuantize()
      .domain([0, Math.sqrt(ROWS * COLS)])
      .range(bassScale)
    bassLine.playNote(noteScale(Math.sqrt(allActiveCount)), decayConst)
  }

  // Age Voice
  // Average age of active cells
  if (generation % 4 === 0) {
    const noteScale = scaleQuantize()
      .domain([1, 3])
      .range(ageScale) // choose octave
    ageVoice.playNote(noteScale(allActiveAgeAverage), decayConst)
  }

  // Drum sound
  if (generation !== 0 && generation % 16 === 0) {
    if (decayConst >= 0.15) {
      drum1.playNote(currentScale[0], decayConst * 0.001)
    }
  }

  // Don't actually render anything to the DOM
  return null
  // return (
  //   <div>
  //     Increase sound volume to hear the music
  //     <input type="range" defaultValue={0} />
  //   </div>
  // )
}
const mapStateToUpdateSoundsProps = ({ board, generation }) => ({ board, generation })
export default connect(mapStateToUpdateSoundsProps)(UpdateSounds)
