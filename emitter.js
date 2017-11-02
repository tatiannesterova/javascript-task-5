'use strict';

/**
 * Сделано задание на звездочку
 * Реализованы методы several и through
 */
getEmitter.isStar = true;
module.exports = getEmitter;

/**
 * Возвращает новый emitter
 * @returns {Object}
 */
function getEmitter() {

    var createEvent = function () {
        var event = {};
        Object.defineProperty(event,
            'subscriptions',
            { value: [], enumerable: false, writable: true });

        return event;

    };

    var baseEvent = createEvent();

    var offEvent = function (event, context) {
        event.subscriptions = event.subscriptions.filter(function (subscription) {
            return subscription.context !== context;
        });
        Object.keys(event).forEach(function (subEvent) {
            offEvent(event[subEvent], context);
        });
    };

    var backEmit = function (event, subEvents) {
        if ((subEvents.length !== 0) && event.hasOwnProperty(subEvents[0])) {
            backEmit(event[subEvents.shift()], subEvents);
        }
        event.subscriptions.forEach(function (subscription) {
            subscription.handler.call(subscription.context);
        });
    };

    return {

        /**
         * Подписаться на событие
         * @param {String} event
         * @param {Object} context
         * @param {Function} handler
         * @returns {Object}
         */
        on: function (event, context, handler) {
            event.split('.').reduce(function (parentEvent, subEvent) {
                if (!parentEvent.hasOwnProperty(subEvent)) {
                    parentEvent[subEvent] = createEvent();
                }

                return parentEvent[subEvent];
            }, baseEvent)
                .subscriptions.push({ context: context, handler: handler });

            return this;
        },

        /**
         * Отписаться от события
         * @param {String} event
         * @param {Object} context
         * @returns {Object}
         */
        off: function (event, context) {
            let messageError = 'на event никто не подписан';
            try {
                offEvent(event.split('.').reduce(function (parentEvent, subEvent) {
                    if (!parentEvent.hasOwnProperty(subEvent)) {
                        throw new TypeError(messageError);
                    }

                    return parentEvent[subEvent];
                }, baseEvent), context);
            } catch (error) {
                if (error.message !== messageError) {
                    throw error;
                }
                console.info(messageError);
            }

            return this;
        },

        /**
         * Уведомить о событии
         * @param {String} event
         * @returns {Object}
         */
        emit: function (event) {
            backEmit(baseEvent, event.split('.'));

            return this;
        },

        /**
         * Подписаться на событие с ограничением по количеству полученных уведомлений
         * @star
         * @param {String} event
         * @param {Object} context
         * @param {Function} handler
         * @param {Number} times – сколько раз получить уведомление
         * @returns {Object}
         */
        several: function (event, context, handler, times) {
            if (times <= 0) {
                return this.on(event, context, handler);
            }
            var countEmitted = 0;

            return this.on(event, context, function () {
                if (times > countEmitted) {
                    handler.call(context);
                }
                countEmitted += 1;
            });
        },

        /**
         * Подписаться на событие с ограничением по частоте получения уведомлений
         * @star
         * @param {String} event
         * @param {Object} context
         * @param {Function} handler
         * @param {Number} frequency – как часто уведомлять
         * @returns {Object}
         */
        through: function (event, context, handler, frequency) {
            if (frequency <= 0) {
                return this.on(event, context, handler);
            }
            var countEmitted = 0;

            return this.on(event, context, function () {
                if ((countEmitted % frequency) === 0) {
                    handler.call(context);
                }
                countEmitted += 1;
            });
        }
    };
}
