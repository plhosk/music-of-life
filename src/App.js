// LIBRARIES: React, Redux, React-Redux
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { createStore, combineReducers } from 'redux'
import { Provider, connect } from 'react-redux'
import { scaleQuantize } from 'd3-scale'

import './App.css'

import frequencies from './frequencies.js'

// CONSTANTS
const ROWS = 30 // height of board. default 50
const COLS = 50 // width. default 120
const STEP_INTERVAL = 25 // milliseconds
const RANDOM_DENSITY = 0.37
// const RANDOM_DENSITY = 0.37 // optimum value



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
  const activeTotalToNote = scaleQuantize()
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





// MISC FUNCTIONS

// Computes next state of board from current state
const advanceBoardHelper = (current) => {
  let next = []
  let row, col  
  for (row = 0; row < ROWS; row++) {
    next.push([])
    for (col = 0; col < COLS; col++) {
      // count neighbours with age > 0
      const rowUp = row === 0 ? ROWS - 1 : row - 1
      const rowDown = row === ROWS - 1 ? 0 : row + 1
      const colLeft = col === 0 ? COLS - 1 : col - 1
      const colRight = col === COLS - 1 ? 0 : col + 1
      let neighbours = 0
      neighbours += current[rowUp][colLeft] > 0 ? 1 : 0
      neighbours += current[rowUp][col] > 0 ? 1 : 0
      neighbours += current[rowUp][colRight] > 0 ? 1 : 0
      neighbours += current[row][colLeft] > 0 ? 1 : 0
      neighbours += current[row][colRight] > 0 ? 1 : 0
      neighbours += current[rowDown][colLeft] > 0 ? 1 : 0
      neighbours += current[rowDown][col] > 0 ? 1 : 0
      neighbours += current[rowDown][colRight] > 0 ? 1 : 0
      if (current[row][col] > 0) {
        switch (neighbours) {
          case 0:
          case 1:
            next[row].push(0)
            break
          case 2:
          case 3:
            next[row].push(current[row][col] === 7 ? 7 : current[row][col] + 1)
            break
          case 4:
          case 5:
          case 6:
          case 7:
          default:
            next[row].push(0)
            break
        }
      } else {
        next[row].push(neighbours === 3 ? 1 : 0)
      }
    }
  }
  return next
}

// Randomizes or clears board
const initializeBoardHelper = (randomize = true) => {
  let i, j
  let board = []
  for (i = 0; i < ROWS; i++) {
    board.push([])
    for (j = 0; j < COLS; j++) {
      board[i].push(randomize ? (Math.random() < RANDOM_DENSITY ? 1 : 0) : 0)
    }
  }
  return board
}

// Activate or deactivate a specific cell
const changeCellHelper = (state, cellRow, cellCol, newAge) => {
  let boardCopy = []
  for (let i = 0; i < ROWS; i++) {
    boardCopy.push(state[i].slice())
  }
  boardCopy[cellRow][cellCol] = newAge
  return boardCopy
}

// ACTION CREATORS

const advanceBoard = () => {
  return {
    type: "ADVANCE_BOARD"
  }
}

const initializeBoard = (randomize) => {
  return {
    type: "INITIALIZE_BOARD",
    board: initializeBoardHelper(randomize)
  }
}

const simulationStart = () => ({type: "SIMULATION_START"})
const simulationPause = () => ({type: "SIMULATION_PAUSE"})

const cellOn = (row, col) => ({
  type: "CELL_ON",
  row,
  col
})
const cellOff = (row, col) => ({
  type: "CELL_OFF",
  row,
  col
})

// COMPONENTS

// Responsible for the auto advance timer.
// This component only mounts while simulation is
// running and unmounts while paused
let intervalID
class AutoStep extends Component {
  constructor(props) {
    super(props)
    intervalID = setInterval(props.tick, STEP_INTERVAL)
  }
  componentWillUnmount() {
    clearInterval(intervalID)
  }
  render() {
    return null
  }
}

// All the control buttons
const Controls = ({ simulating, tick, reinitialize, start, pause }) => (
  <div>
    {simulating && <AutoStep tick={tick} />}
    {simulating ? (<button onClick={() => pause()}>Pause</button>) : (<button onClick={() => start()}>Start</button>)}
    <button onClick={() => tick()} style={simulating ? {opacity: 0.2} : {}}>Advance</button>
    <button onClick={() => reinitialize(true)}>Randomize</button>
    <button onClick={() => reinitialize(false)}>Clear</button>
    <button onClick={() => voice1.setGain(0)}>Voice1 Stop</button>
    { /* <button onClick={() => voice2.setGain(0)}>Voice2 Stop</button>
    <button onClick={() => {soundNote(noteValues['C#4'], 0.2)}}>Play Note</button>
    <button onClick={soundStop}>Stop Sound</button> */ }
  </div>
)
Controls.propTypes = {
  simulating: PropTypes.bool.isRequired,
  tick: PropTypes.func.isRequired,
  reinitialize: PropTypes.func.isRequired,
  start: PropTypes.func.isRequired,
  pause: PropTypes.func.isRequired
}
const mapStateToControlsProps = ({ simulating }) => ({ simulating })
const mapDispatchToControlsProps = (dispatch) => {
  return {
    tick: () => dispatch(advanceBoard()),
    reinitialize: (randomize) => dispatch(initializeBoard(randomize)),
    start: () => dispatch(simulationStart()),
    pause: () => dispatch(simulationPause())
  }
}
const ControlsContainer = connect(mapStateToControlsProps, mapDispatchToControlsProps)(Controls)

// Each square on the board is a Cell
class Cell extends Component {
  
  shouldComponentUpdate(nextProps) {
    if (this.props.age !== nextProps.age) {
      return true
    }
    return false
  }

  onMouseOver = (e) => {
    if (e.buttons === 0) {
      return
    }
    console.log(typeof e.currentTarget.dataset.age)
    if (e.buttons === 1 && parseInt(e.currentTarget.dataset.age, 10) === 0) {
      this.props.handleLeftClick(e.currentTarget.dataset.row, e.currentTarget.dataset.col)
      return
    }
    if (e.buttons === 2 && parseInt(e.currentTarget.dataset.age, 10) > 0) {
      this.props.handleRightClick(e.currentTarget.dataset.row, e.currentTarget.dataset.col)
      return
    }
  }

  onMouseDown = (e) => {
    if (e.button === 0 && parseInt(e.currentTarget.dataset.age, 10) === 0) {
      this.props.handleLeftClick(e.currentTarget.dataset.row, e.currentTarget.dataset.col)
    } else if (e.button === 2 && parseInt(e.currentTarget.dataset.age, 10) > 0) {
      this.props.handleRightClick(e.currentTarget.dataset.row, e.currentTarget.dataset.col)
    }
  }
  onContextMenu = (e) => {
    e.preventDefault()
  }

  render() {
    const { rowIndex, colIndex, age } = this.props

    return (
      <td
        className={"cell cell-" + age}
        data-row={rowIndex}
        data-col={colIndex}
        data-age={age}
        onMouseOver={this.onMouseOver}
        onMouseDown={this.onMouseDown}
        onContextMenu={this.onContextMenu}
      />
    )
  }
}

const Board = ({ board, tick, handleLeftClick, handleRightClick }) => (
  <table>
    <tbody>
      {board.map((row, rowIndex) => (
        <tr key={rowIndex}>
          {row.map((age, colIndex) => (
            <Cell
              key={colIndex}
              rowIndex={rowIndex}
              colIndex={colIndex}
              age={age}
              handleLeftClick={handleLeftClick}
              handleRightClick={handleRightClick}
            />
          ))}
        </tr>
      ))}
    </tbody>
  </table>
)
Board.propTypes = {
  board: PropTypes.array.isRequired,
  handleLeftClick: PropTypes.func.isRequired,
  handleRightClick: PropTypes.func.isRequired
}
const mapStateToBoardProps = ({ board }) => ({ board })
const mapDispatchToBoardProps = (dispatch) => {
  return {
    handleLeftClick: (row, col) => dispatch(cellOn(row, col)),
    handleRightClick: (row, col) => dispatch(cellOff(row, col))
  }
}
const BoardContainer = connect(mapStateToBoardProps, mapDispatchToBoardProps)(Board)

const GenerationCounter = ({ generation }) => (
  <p>
    Generation: {generation}
  </p>
)
GenerationCounter.propTypes = {
  generation: PropTypes.number.isRequired,
}
const mapStateToGenerationCounterProps = ({ generation }) => ({ generation })
const GenerationCounterContainer = connect(mapStateToGenerationCounterProps)(GenerationCounter)

const GameOfLifeApp = () => (
  <div>
    <h1>Conway's Game of Life (React/Redux)</h1>
    <ControlsContainer />
    <GenerationCounterContainer />
    <BoardContainer />
    <UpdateSoundsContainer />
  </div>
)

// REDUCERS

const boardReducer = (state = [], action) => {
  switch (action.type) {
    case "ADVANCE_BOARD":
      return advanceBoardHelper(state)
    case "INITIALIZE_BOARD":
      return action.board
    case "CELL_ON":
      return changeCellHelper(state, action.row, action.col, 1)
    case "CELL_OFF":
      return changeCellHelper(state, action.row, action.col, 0)
    default:
      return state
  }
}

const simulatingReducer = (state = true, action) => {
  switch (action.type) {
    case "SIMULATION_START":
      return true
    case "SIMULATION_PAUSE":
      return false
    default:
      return state
  }
}

const generationReducer = (state = 0, action) => {
  switch (action.type) {
    case "ADVANCE_BOARD":
      return state += 1
    case "INITIALIZE_BOARD":
      return 0
    default:
      return state
  }
}

const reducers = combineReducers({
  board: boardReducer,
  simulating: simulatingReducer,
  generation: generationReducer
})

// APPLICATION WRAPPER

const initialState = {
  board: initializeBoardHelper(true),
  simulating: true,
  generation: 0
}

const App = () => (
  <Provider store={createStore(reducers, initialState)}>
    <GameOfLifeApp />
  </Provider>
)

export default App
