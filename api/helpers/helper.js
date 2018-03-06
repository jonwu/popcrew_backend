const moment = require('moment');
const _ = require('lodash');
const mongoose = require('mongoose');

const Event = mongoose.model('Events');
const Blackout = mongoose.model('Blackouts');
const Invitation = mongoose.model('Invitations');

exports.handleInvites = function(date) {
  // 1. Find all events by date, weight, and status
  return Event.find()
    .where('valid_days')
    .equals(getDay(date))
    .where('status')
    .equals('idle')
    .then(events => {
      // 2. shuffle events
      const shuffledEvents = _.shuffle(events);
      let chainedPromises = Promise.resolve();
      shuffledEvents.map(event => {
        chainedPromises = chainedPromises
          .then((resp) => {
            //3. get all blackouts from group of users & checked if first day is blacked out
            return isBlackedOutPromise(event.users, date);
          })
          .then(isBlackedOut => {
            if (!isBlackedOut) {
              // Update event to pending
              Event.findOneAndUpdate({ _id: event._id }, {status: 'pending'}).exec();

              // 4. Check if valid days are blacked out
              const isBlackedOutPromises = event.valid_days.map(day => {
                const validDate = getNextDate(date, day);
                return isBlackedOutPromise(event.users, validDate);
              });

              // 5. Choose at most 3 random days
              return Promise.all(isBlackedOutPromises).then(isBlackedOuts => {
                const availableDays = event.valid_days.filter((days, i) => !isBlackedOuts[i]);
                const availableDates = availableDays
                  .map(day => getNextDate(date, day))
                  .sort((left, right) => left.diff(right));

                const randomDates = [
                  availableDates[0],
                  ..._.sampleSize(availableDates.slice(1), 2),
                ];
                // 6. Blackout the random days
                const createBlackouts = randomDates.map(date => {
                  const blackouts = event.users.map(user => {
                    return new Blackout({date, user, event: event._id}).save();
                  })
                  return Promise.all(blackouts)
                })
                console.log(event.name, randomDates)

                // 7. Send out invitations
                event.users.map(user => {
                  new Invitation({ dates_options: randomDates, user, event: event._id }).save();
                })

                return Promise.all(createBlackouts)
              });
            }
            return Promise.resolve()
          });
      });
      return chainedPromises;
    });
};

function getNextDate(date, day) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const nDay = days.indexOf(day);
  if (moment(date).isoWeekday() <= nDay) return moment().isoWeekday(nDay).startOf('day');
  return moment()
    .add(1, 'weeks')
    .isoWeekday(nDay)
    .startOf('day');
}

function getDay(date) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[moment(date).isoWeekday()];
}

function isBlackedOutPromise(users, date) {
  const start = moment(date).startOf('day');
  const end = moment(date).endOf('day');
  return Blackout.find()
    .where('user')
    .in(users)
    .where('date')
    .gte(start)
    .lte(end)
    .then(blackouts => {
      return blackouts.length > 0
    });
}
