// MISC FUNCTIONS

// Computes next state of board from current state
const advanceBoardHelper = (current) => {
  let next = []
  let row, col  
  for (row = 0; row < ROWS; row++) {
    next.push([])
    for (col = 0; col < COLS; col++) {
      const neighbours = (() => {
        const rowUp = row === 0 ? ROWS - 1 : row - 1
        const rowDown = row === ROWS - 1 ? 0 : row + 1
        const colLeft = col === 0 ? COLS - 1 : col - 1
        const colRight = col === COLS - 1 ? 0 : col + 1
        let num = 0
        num += current[rowUp][colLeft] > 0 ? 1 : 0
        num += current[rowUp][col] > 0 ? 1 : 0
        num += current[rowUp][colRight] > 0 ? 1 : 0
        num += current[row][colLeft] > 0 ? 1 : 0
        num += current[row][colRight] > 0 ? 1 : 0
        num += current[rowDown][colLeft] > 0 ? 1 : 0
        num += current[rowDown][col] > 0 ? 1 : 0
        num += current[rowDown][colRight] > 0 ? 1 : 0
        return num
      })()
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
          case 8:
            next[row].push(0)
            break
        }
      } else {
        next[row].push(neighbours == 3 ? 1 : 0)
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
