/**
 * Audio is completely disabled per project presentation specifications.
 * This stub guarantees zero audio synthesis, zero speech synthesis, and zero latency.
 */

export const soundEffects = {
  playGavelStrike: () => {},
  announceBidPlaced: () => {},
  announceGoingOnce: () => {},
  announceGoingTwice: () => {},
  announceSold: () => {},
  announcePass: () => {},
  announceNominate: () => {},
  announceReset: () => {},
  announceTradeCompleted: () => {},
  getSettings: () => ({ soundEnabled: false, announcerEnabled: false }),
  updateSettings: () => {},
};
