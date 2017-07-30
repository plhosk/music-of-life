// CONSTANTS
const ROWS = 40 // height of board. default 50
const COLS = 60 // width. default 120
const STEP_INTERVAL = 25 // milliseconds
const RANDOM_DENSITY = 0.37
// const RANDOM_DENSITY = 0.37 // optimum value

// LIBRARIES: React, Redux, React-Redux
const { Component } = React
const { PropTypes } = React
const { createStore } = Redux
const { combineReducers } = Redux
const { Provider } = ReactRedux
const { connect } = ReactRedux
