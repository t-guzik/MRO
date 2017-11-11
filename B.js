import { data as data1 } from './B1data'
import { data as data2 } from './B2data'
import math from 'mathjs';
import fs from 'fs';
import _ from 'lodash';
import chalk from 'chalk';
import now from 'performance-now';
import cov from 'compute-covariance'
import numeric from 'numeric'

const plotly = require('plotly')()

// Logging
const log       = console.log;
const padding   = 18;
const info      = text => log(chalk.bold.blue(text))
const time      = text => log(chalk.redBright('Execution time: '.padding(padding) + text + 'ms\n'))
const totalTime = text => log(chalk.red('Total execution time: '.padding(padding) + text + 'ms\n'))

// Utils
String.prototype.padding = function (n, c) {
  let val = this.valueOf();
  if (Math.abs(n) <= val.length) {
    return val;
  }

  let m   = Math.max((Math.abs(n) - this.length) || 0, 0);
  let pad = new Array(m + 1).join(String(c || ' ').charAt(0));

  return (n < 0) ? pad + val : val + pad;
};

const totalTimeMsg = '###total###';

const measurePerformance = (fun, ...args) => {
  const start        = now()
  const result       = fun(...args)
  const end          = now()
  const measuredTime = (end - start)

  args[0] !== totalTimeMsg ? time(measuredTime.toPrecision(5)) : totalTime(measuredTime.toPrecision(5))

  return result;
}

const getTwoMax = array => {
  const first     = array.indexOf(_.max(array));
  const newArray  = array.slice();
  newArray[first] = -Infinity;
  const second    = newArray.indexOf(_.max(newArray));

  return [first, second]
}

const COLORS = {
  RED    : '#ff5166',
  GREEN  : '#1d870f',
  BLUE   : '#6794ff',
  YELLOW : '#fff858'
}

const calculateCurseOfDimension = (dimension, dataset) => {
  const parsedData = {}

  _(dataset).groupBy(x => x.name)
    .forEach((c, i) => parsedData[i] = c.map(p => [p.x, p.y]))

  const pointsForDimensionInfo = `Liczba punktów: ${dataset.length}`;

  info(`${pointsForDimensionInfo}`)

  let sample = _(Object.keys(parsedData)).map(key => parsedData[key]).concat().flatten().value()

  const separatedVariables = []

  for (let i = 0; i < sample[0].length; i++) {
    separatedVariables.push(_.map(sample, x => x[i]))
  }

  const covariance = cov(separatedVariables)
  const eigen      = numeric.eig(covariance)
  let eigenVector  = eigen.E.x
  let eigenValues  = eigen.lambda.x

  const biggestEigenValues = getTwoMax(eigenValues)

  eigenVector = [eigenVector[biggestEigenValues[0]].filter((x, i) => biggestEigenValues.indexOf(i) !== -1),
    eigenVector[biggestEigenValues[1]].filter((x, i) => biggestEigenValues.indexOf(i) !== -1)
  ]

  sample = _.map(sample, x => {
    return x.filter((y, j) => biggestEigenValues.indexOf(j) !== -1)
  })

  const reorientedSample = math.multiply(math.matrix(sample), math.matrix(eigenVector))._data

  const separatedVariablesReoriented = []

  for (let i = 0; i < reorientedSample[0].length; i++) {
    separatedVariablesReoriented.push(_.map(reorientedSample, x => x[i]))
  }

  const endClassIndexes = {
    '0' : parsedData['1'].length,
    '1' : parsedData['2'].length + parsedData['1'].length,
    '2' : parsedData['2'].length + parsedData['1'].length + parsedData['3'].length,
    '3' : parsedData['2'].length + parsedData['1'].length + parsedData['3'].length + parsedData['4'].length
  }

  // const line = {
  //   x      : [eigenValues[biggestEigenValues[0]] * eigenVector[0][0], eigenValues[biggestEigenValues[0]] * eigenVector[1][0]],
  //   y      : [eigenValues[biggestEigenValues[0]] * eigenVector[0][1], eigenValues[biggestEigenValues[0]] * eigenVector[1][1]],
  //   name   : 'Princincipal components',
  //   marker : {
  //     size : 5,
  //     line : {
  //       color : '#ff34e6',
  //       width : 0.5
  //     }
  //   },
  //   type   : 'line'
  // };

  // const trace1 = {
  //   x      : separatedVariablesReoriented[0].slice(0, endClassIndexes['0']),
  //   y      : separatedVariablesReoriented[1].slice(0, endClassIndexes['0']),
  //   mode   : 'markers',
  //   name   : 'Klasa 1',
  //   marker : {
  //     size : 5,
  //     line : {
  //       color : COLORS.YELLOW,
  //       width : 0.5
  //     }
  //   },
  //   type   : 'scatter'
  // };
  //
  // const trace2 = {
  //   x      : separatedVariablesReoriented[0].slice(endClassIndexes['0'], endClassIndexes['1']),
  //   y      : separatedVariablesReoriented[1].slice(endClassIndexes['0'], endClassIndexes['1']),
  //   name   : 'Klasa 2',
  //   mode   : 'markers',
  //   marker : {
  //     size : 5,
  //     line : {
  //       color : COLORS.BLUE,
  //       width : 0.5
  //     }
  //   },
  //   type   : 'scatter'
  // };
  //
  // const trace3 = {
  //   x      : separatedVariablesReoriented[0].slice(endClassIndexes['1'], endClassIndexes['2']),
  //   y      : separatedVariablesReoriented[1].slice(endClassIndexes['1'], endClassIndexes['2']),
  //   name   : 'Klasa 3',
  //   mode   : 'markers',
  //   marker : {
  //     size : 5,
  //     line : {
  //       color : COLORS.RED,
  //       width : 0.5
  //     }
  //   },
  //   type   : 'scatter'
  // };
  //
  // const trace4 = {
  //   x      : separatedVariablesReoriented[0].slice(endClassIndexes['2'], endClassIndexes['3']),
  //   y      : separatedVariablesReoriented[1].slice(endClassIndexes['2'], endClassIndexes['3']),
  //   name   : 'Klasa 4',
  //   mode   : 'markers',
  //   marker : {
  //     size : 5,
  //     line : {
  //       color : COLORS.GREEN,
  //       width : 0.5
  //     }
  //   },
  //   type   : 'scatter'
  // };

  const trace1 = {
    x      : separatedVariables[0].slice(0, endClassIndexes['0']),
    y      : separatedVariables[1].slice(0, endClassIndexes['0']),
    mode   : 'markers',
    name   : 'Klasa 1',
    marker : {
      size : 5,
      line : {
        color : COLORS.YELLOW,
        width : 0.5
      }
    },
    type   : 'scatter'
  };

  const trace2 = {
    x      : separatedVariables[0].slice(endClassIndexes['0'], endClassIndexes['1']),
    y      : separatedVariables[1].slice(endClassIndexes['0'], endClassIndexes['1']),
    name   : 'Klasa 2',
    mode   : 'markers',
    marker : {
      size : 5,
      line : {
        color : COLORS.BLUE,
        width : 0.5
      }
    },
    type   : 'scatter'
  };

  const trace3 = {
    x      : separatedVariables[0].slice(endClassIndexes['1'], endClassIndexes['2']),
    y      : separatedVariables[1].slice(endClassIndexes['1'], endClassIndexes['2']),
    name   : 'Klasa 3',
    mode   : 'markers',
    marker : {
      size : 5,
      line : {
        color : COLORS.RED,
        width : 0.5
      }
    },
    type   : 'scatter'
  };

  const trace4 = {
    x      : separatedVariables[0].slice(endClassIndexes['2'], endClassIndexes['3']),
    y      : separatedVariables[1].slice(endClassIndexes['2'], endClassIndexes['3']),
    name   : 'Klasa 4',
    mode   : 'markers',
    marker : {
      size : 5,
      line : {
        color : COLORS.GREEN,
        width : 0.5
      }
    },
    type   : 'scatter'
  };

  const data = [trace1, trace2, trace3, trace4, line];

  const layout = {
    autosize : true,
    title    : `PCA zadanie B zestaw 2`,
    xaxis    : {
      title    : 'x',
      showgrid : false,
      zeroline : false
    },
    yaxis    : {
      title    : 'y',
      showline : false
    }
  };

  const graphOptions = {
    filename : `PCA B part 2`,
    layout   : layout,
    fileopt  : 'overwrite'
  };

  plotly.plot(data, graphOptions, function (err, msg) {
    console.log(msg);
  });
}

// Execution
measurePerformance(() => {
  calculateCurseOfDimension(2, data2)
}, totalTimeMsg)
