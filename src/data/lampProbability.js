// Lamp Level probabilities
const levelChances = {
    1: [0.8, 0.15, 0.05, 0, 0, 0, 0, 0, 0, 0, 0],
    2: [0.735, 0.17, 0.08, 0.015, 0, 0, 0, 0, 0, 0, 0],
    3: [0.68, 0.2, 0.1, 0.02, 0, 0, 0, 0, 0, 0, 0],
    4: [0.6, 0.25, 0.123, 0.025, 0.002, 0, 0, 0, 0, 0, 0],
    5: [0.5, 0.3, 0.167, 0.03, 0.003, 0, 0, 0, 0, 0, 0],
    6: [0.4, 0.35, 0.206, 0.04, 0.004, 0, 0, 0, 0, 0, 0],
    7: [0.3, 0.4, 0.2445, 0.05, 0.005, 0.0005, 0, 0, 0, 0, 0],
    8: [0.2, 0.45, 0.2832, 0.06, 0.006, 0.0008, 0, 0, 0, 0, 0],
    9: [0.1, 0.4, 0.4109, 0.08, 0.008, 0.001, 0.0001, 0, 0, 0, 0],
    10: [0, 0.35, 0.5393, 0.1, 0.009, 0.0015, 0.0002, 0, 0, 0, 0],
    11: [0, 0.3, 0.5677, 0.12, 0.01, 0.002, 0.0003, 0, 0, 0, 0],
    12: [0, 0.25, 0.5921, 0.14, 0.015, 0.0025, 0.0004, 0, 0, 0, 0],
    13: [0, 0.2, 0.6163, 0.16, 0.02, 0.003, 0.0006, 0.0001, 0, 0, 0],
    14: [0, 0.1, 0.6905, 0.18, 0.025, 0.0035, 0.0008, 0.0002, 0, 0, 0],
    15: [0, 0, 0.7647, 0.2, 0.03, 0.004, 0.001, 0.0003, 0, 0, 0],
    16: [0, 0, 0.7031, 0.25, 0.04, 0.005, 0.0015, 0.0004, 0, 0, 0],
    17: [0, 0, 0.6375, 0.3, 0.05, 0.01, 0.002, 0.0005, 0, 0, 0],
    18: [0, 0, 0.5569, 0.35, 0.075, 0.015, 0.0025, 0.0006, 0, 0, 0],
    19: [0, 0, 0.4763, 0.4, 0.1, 0.02, 0.003, 0.0007, 0, 0, 0],
    20: [0, 0, 0.39505, 0.45, 0.125, 0.025, 0.004, 0.0008, 0.00015, 0, 0],
    21: [0, 0, 0.3139, 0.5, 0.15, 0.03, 0.005, 0.0009, 0.0002, 0, 0],
    22: [0, 0, 0.23275, 0.55, 0.175, 0.035, 0.006, 0.001, 0.00025, 0, 0],
    23: [0, 0, 0.1515, 0.6, 0.2, 0.04, 0.007, 0.0012, 0.0003, 0, 0],
    24: [0, 0, 0.1, 0.6201, 0.225, 0.045, 0.008, 0.0014, 0.0004, 0.0001, 0],
    25: [0, 0, 0, 0.68875, 0.25, 0.05, 0.009, 0.0016, 0.0005, 0.00015, 0],
    26: [0, 0, 0, 0.6523, 0.225, 0.06, 0.01, 0.0018, 0.0006, 0.0003, 0],
    27: [0, 0, 0, 0.6149, 0.3, 0.07, 0.012, 0.002, 0.0007, 0.0004, 0],
    28: [0, 0, 0, 0.577, 0.325, 0.08, 0.014, 0.0025, 0.0009, 0.0005, 0.0001],
    29: [0, 0, 0, 0.5391, 0.35, 0.09, 0.016, 0.003, 0.0011, 0.0006, 0.0002],
    30: [0, 0, 0, 0.5007, 0.375, 0.1, 0.018, 0.004, 0.0013, 0.0007, 0.0003],
    31: [0, 0, 0, 0.4623, 0.4, 0.11, 0.02, 0.005, 0.0015, 0.0008, 0.0004],
    32: [0, 0, 0, 0.4239, 0.425, 0.12, 0.022, 0.006, 0.0017, 0.0009, 0.0005]
};

// Export the levelChances object
module.exports = { levelChances };