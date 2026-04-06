// Web shim for expo-modules-core
// On web, native modules are not available. This shim provides no-op stubs.

const { useState, useCallback, useEffect, useRef } = require('react');

class CodedError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = 'CodedError';
  }
}

class UnavailabilityError extends Error {
  constructor(moduleName, propertyName) {
    super(
      `The method or property ${moduleName}.${propertyName} is not available on web.`
    );
    this.code = 'ERR_UNAVAILABLE';
    this.name = 'UnavailabilityError';
  }
}

const PermissionStatus = {
  GRANTED: 'granted',
  UNDETERMINED: 'undetermined',
  DENIED: 'denied',
};

function requireOptionalNativeModule(moduleName) {
  return null;
}

function requireNativeModule(moduleName) {
  throw new UnavailabilityError(moduleName, '(native module)');
}

function requireNativeViewManager(viewName) {
  return null;
}

class EventEmitter {
  addListener() { return { remove: () => {} }; }
  removeAllListeners() {}
  emit() {}
}

class NativeModule extends EventEmitter {}
class SharedObject {}
class SharedRef {}

class LegacyEventEmitter {
  constructor() {
    this._listeners = {};
  }
  addListener(eventName, listener) {
    if (!this._listeners[eventName]) this._listeners[eventName] = [];
    this._listeners[eventName].push(listener);
    return { remove: () => this.removeListener(eventName, listener) };
  }
  removeListener(eventName, listener) {
    if (!this._listeners[eventName]) return;
    this._listeners[eventName] = this._listeners[eventName].filter(l => l !== listener);
  }
  removeAllListeners(eventName) {
    if (eventName) delete this._listeners[eventName];
    else this._listeners = {};
  }
  emit(eventName, ...args) {
    if (!this._listeners[eventName]) return;
    this._listeners[eventName].forEach(l => l(...args));
  }
}

const NativeModulesProxy = {};
const Platform = { OS: 'web' };

function createPermissionHook(methods) {
  return function usePermission(options) {
    const isMounted = useRef(true);
    const [status, setStatus] = useState(null);
    const { get = true, request: autoRequest = false } = options || {};

    const getPermission = useCallback(async () => {
      const response = await methods.getMethod();
      if (isMounted.current) setStatus(response);
      return response;
    }, []);

    const requestPermission = useCallback(async () => {
      const response = await methods.requestMethod();
      if (isMounted.current) setStatus(response);
      return response;
    }, []);

    useEffect(() => {
      if (autoRequest) requestPermission();
      else if (get) getPermission();
    }, [get, autoRequest]);

    useEffect(() => {
      isMounted.current = true;
      return () => { isMounted.current = false; };
    }, []);

    return [status, requestPermission, getPermission];
  };
}

function registerWebModule(moduleImplementation) {
  return moduleImplementation;
}

module.exports = {
  CodedError,
  UnavailabilityError,
  PermissionStatus,
  requireOptionalNativeModule,
  requireNativeModule,
  requireNativeViewManager,
  EventEmitter,
  NativeModule,
  SharedObject,
  SharedRef,
  NativeModulesProxy,
  LegacyEventEmitter,
  Platform,
  createPermissionHook,
  registerWebModule,
};
