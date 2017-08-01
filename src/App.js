// LIBRARIES: React, Redux, React-Redux
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { createStore, combineReducers } from 'redux'
import { Provider, connect } from 'react-redux'

import './App.css'
import UpdateSoundsContainer from './Audio.js'

// CONSTANTS
export const ROWS = 30 // height of board. default 30
export const COLS = 80 // width. default 80
export const STEP_INTERVAL = 50 // milliseconds
export const RANDOM_DENSITY = 0.37 // 0.37
// const RANDOM_DENSITY = 0.37 // optimum value

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
    <div>
      {simulating && <AutoStep tick={tick} />}
      {simulating ? (<button onClick={() => pause()}>Pause</button>) : (<button onClick={() => start()}>Start</button>)}
      <button onClick={() => tick()} style={simulating ? {opacity: 0.2} : {}}>Advance</button>
      <button onClick={() => reinitialize(true)}>Randomize</button>
      <button onClick={() => reinitialize(false)}>Clear</button>
    </div>
    <div>
      { /* <button onClick={() => {
        semitoneOffset = 0
        calculateScales(semitoneOffset)
      }}>key 0</button>
      <button onClick={() => {
        semitoneOffset = 2
        calculateScales(semitoneOffset)
      }}>key 2</button>
      <button onClick={() => {
        semitoneOffset = 4
        calculateScales(semitoneOffset)
      }}>key 4</button>
      <button onClick={() => {
        semitoneOffset = 6
        calculateScales(semitoneOffset)
      }}>key 6</button>
      <button onClick={() => {
        semitoneOffset = 8
        calculateScales(semitoneOffset)
      }}>key 8</button>
      { /* <button onClick={() => voice2.setGain(0)}>Voice2 Stop</button>
      <button onClick={() => {soundNote(noteValues['C#4'], 0.2)}}>Play Note</button>
      <button onClick={soundStop}>Stop Sound</button> */ }
    </div>
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
    <h1>Music of Life</h1>
    <h3>Generate music from cellular automata</h3>
    <ControlsContainer />
    <GenerationCounterContainer />
    <UpdateSoundsContainer />
    <BoardContainer />
    <div className="footer">
      <br />
      2017 Paul Hoskinson&nbsp;&nbsp;&nbsp;<a href="https://github.com/plhosk/music-of-life">GitHub</a>
    </div>
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
