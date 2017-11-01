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
    var definePropertiesForEvent = function (event) {
        Object.defineProperties(event, {
            'subscriptions': { value: [], enumerable: false, writable: true },
            'countEmitted': { value: 0, enumerable: false, writable: true }
        });
    };

    var events = {};
    definePropertiesForEvent(events);

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
        event.subscriptions = event.subscriptions.filter(function (subscription) {
            if (subscription.hasOwnProperty('frequency') &&
                (event.countEmitted % subscription.frequency) !== 0) {
                return true;
            }
            if (subscription.hasOwnProperty('times') && subscription.times <= event.countEmitted) {
                return false;
            }
            subscription.handler.call(subscription.context);

            return true;
        });
        event.countEmitted += 1;
    };

    var getEvent = function (nameEvent) {
        return nameEvent.split('.').reduce(function (parentEvent, subEvent) {
            if (!parentEvent.hasOwnProperty(subEvent)) {
                parentEvent[subEvent] = {};
                definePropertiesForEvent(parentEvent[subEvent]);
            }

            return parentEvent[subEvent];
        }, events);
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
            this.through(event, context, handler, 1);

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
                }, events), context);
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
            backEmit(events, event.split('.'));

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
            times = times > 0 ? times : 1;
            getEvent(event).subscriptions.push({ context: context,
                handler: handler,
                times: times });

            return this;
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
            frequency = frequency > 0 ? frequency : 1;
            getEvent(event).subscriptions.push({ context: context,
                handler: handler,
                frequency: frequency });

            return this;
        }
    };
}
