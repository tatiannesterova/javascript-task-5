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
    const baseEvent = { subscriptions: [], subEvents: {} };

    const offEvent = function (event, context) {
        event.subscriptions = event.subscriptions.filter(function (subscription) {
            return subscription.context !== context;
        });
        Object.keys(event.subEvents).forEach(function (subEvent) {
            offEvent(event.subEvents[subEvent], context);
        });
    };

    const emitEvent = function (event, subEvents) {
        if ((subEvents.length !== 0) && event.subEvents.hasOwnProperty(subEvents[0])) {
            emitEvent(event.subEvents[subEvents.shift()], subEvents);
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
                if (!parentEvent.subEvents.hasOwnProperty(subEvent)) {
                    parentEvent.subEvents[subEvent] = { subscriptions: [], subEvents: {} };
                }

                return parentEvent.subEvents[subEvent];
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
            const MESSAGE_ERROR = 'на event никто не подписан';

            try {
                const deletingEvent = event.split('.').reduce(function (parentEvent, subEvent) {
                    if (!parentEvent.subEvents.hasOwnProperty(subEvent)) {
                        throw new TypeError(MESSAGE_ERROR);
                    }

                    return parentEvent.subEvents[subEvent];
                }, baseEvent);

                offEvent(deletingEvent, context);
            } catch (error) {
                if (error.message !== MESSAGE_ERROR) {
                    throw error;
                }
                console.info(MESSAGE_ERROR);
            }

            return this;
        },

        /**
         * Уведомить о событии
         * @param {String} event
         * @returns {Object}
         */
        emit: function (event) {
            emitEvent(baseEvent, event.split('.'));

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
            let countEmitted = 0;

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
            let count = frequency;

            return this.on(event, context, function () {
                if (count === frequency) {
                    handler.call(context);
                    count = 0;
                }
                count += 1;
            });
        }
    };
}
