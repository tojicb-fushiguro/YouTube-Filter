/**
 * Cross-Browser Compatibility Layer
 *
 * Provides a unified API for both Chrome and Firefox extensions.
 * Firefox uses browser.* with Promises, Chrome uses chrome.* with callbacks.
 * This polyfill ensures both browsers work seamlessly.
 *
 * @author tojicb-fushiguro
 * @repository https://github.com/tojicb-fushiguro/YouTube-Filter
 * @license MIT
 */

(function () {
  'use strict';

  if (typeof browser !== 'undefined' && browser.runtime) {
    return;
  }

  if (typeof chrome !== 'undefined' && chrome.runtime) {
    window.browser = {
      runtime: {
        onMessage: chrome.runtime.onMessage,
        lastError: chrome.runtime.lastError,
        sendMessage: function (...args) {
          return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(...args, (response) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve(response);
              }
            });
          });
        }
      },
      storage: {
        sync: {
          get: function (keys) {
            return new Promise((resolve, reject) => {
              chrome.storage.sync.get(keys, (result) => {
                if (chrome.runtime.lastError) {
                  reject(chrome.runtime.lastError);
                } else {
                  resolve(result);
                }
              });
            });
          },
          set: function (items) {
            return new Promise((resolve, reject) => {
              chrome.storage.sync.set(items, () => {
                if (chrome.runtime.lastError) {
                  reject(chrome.runtime.lastError);
                } else {
                  resolve();
                }
              });
            });
          }
        },
        onChanged: chrome.storage.onChanged
      },
      tabs: {
        query: function (queryInfo) {
          return new Promise((resolve, reject) => {
            chrome.tabs.query(queryInfo, (tabs) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve(tabs);
              }
            });
          });
        },
        sendMessage: function (tabId, message) {
          return new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(tabId, message, (response) => {
              if (chrome.runtime.lastError) {
                if (
                  chrome.runtime.lastError.message &&
                  chrome.runtime.lastError.message.includes('Could not establish connection')
                ) {
                  resolve(undefined);
                } else {
                  reject(chrome.runtime.lastError);
                }
              } else {
                resolve(response);
              }
            });
          });
        }
      }
    };
  }
})();
