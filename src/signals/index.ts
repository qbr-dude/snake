/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
export { createComputed } from './src/computed';
export type { ComputedNode } from './src/computed';
export {
  createLinkedSignal,
  linkedSignalSetFn,
  linkedSignalUpdateFn
} from './src/linked_signal';
export type {
  ComputationFn,
  LinkedSignalNode,
  LinkedSignalGetter
} from './src/linked_signal';
export { defaultEquals } from './src/equality';
export type { ValueEqualityFn } from './src/equality';
export {setThrowInvalidWriteToSignalError} from './src/errors';
export {
  REACTIVE_NODE, SIGNAL,
  consumerAfterComputation,
  consumerBeforeComputation,
  consumerDestroy,
  consumerMarkDirty,
  consumerPollProducersForChange,
  getActiveConsumer,
  isInNotificationPhase,
  isReactive,
  producerAccessed,
  producerIncrementEpoch,
  producerMarkClean,
  producerNotifyConsumers,
  producerUpdateValueVersion,
  producerUpdatesAllowed,
  runPostProducerCreatedFn,
  setActiveConsumer,
  setPostProducerCreatedFn
} from './src/graph';
export type {
  Reactive,
  ReactiveHookFn,
  ReactiveNode
} from './src/graph';
export {
  SIGNAL_NODE, createSignal,
  runPostSignalSetFn,
  setPostSignalSetFn,
  signalGetFn,
  signalSetFn,
  signalUpdateFn
} from './src/signal';
export type {
  SignalGetter,
  SignalNode
} from './src/signal';
export { createWatch } from './src/watch';
export type { Watch, WatchCleanupFn, WatchCleanupRegisterFn } from './src/watch';
export {setAlternateWeakRefImpl} from './src/weak_ref';
export {untracked} from './src/untracked';
