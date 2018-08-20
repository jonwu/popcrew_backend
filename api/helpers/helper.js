const moment = require('moment');
const _ = require('lodash');
const mongoose = require('mongoose');
const apn = require('apn');
const Event = mongoose.model('Events');
const Blackout = mongoose.model('Blackouts');
const Invitation = mongoose.model('Invitations');
const User = mongoose.model('Users');
const Group = mongoose.model('Groups');
const CronJob = require('cron').CronJob;
const ObjectId = mongoose.Schema.Types.ObjectId;
const Expo = require('expo-server-sdk');

let expo = new Expo();
//
// const options = {
//   token: {
//     key: __dirname + '/AuthKey_PFGVSWDYQ6.p8',
//     keyId: 'PFGVSWDYQ6',
//     teamId: 'Z2MXLM39UM',
//   },
//   production: true,
// };
// const apnProvider = new apn.Provider(options);

exports.initCronJobs = function() {
  const processInvites = this.processInvites;
  const handleInvites = this.handleInvites;
  const processMorningNotifications = this.processMorningNotifications;
  const processNightNotifications = this.processNightNotifications;

  console.log('Initializing cron jobs...');
  new CronJob(
    '00 30 11 * * 0-6',
    function() {
      handleInvites(moment());
    },
    function() {
      /* This function is executed when the job stops */
    },
    true /* Start the job right now */,
  );

  new CronJob(
    '00 30 08 * * 0-6',
    function() {
      processMorningNotifications();
    },
    function() {
      /* This function is executed when the job stops */
    },
    true /* Start the job right now */,
  );

  new CronJob(
    '00 00 20 * * 0-6',
    function() {
      processNightNotifications();
    },
    function() {
      /* This function is executed when the job stops */
    },
    true /* Start the job right now */,
  );

  new CronJob(
    '0 0 */4 * * *',
    function() {
      processInvites();
    },
    function() {
      /* This function is executed when the job stops */
    },
    true /* Start the job right now */,
  );
};
exports.processMorningNotifications = function() {
  const today = moment().startOf('day');
  const tommorow = today.clone().add(1, 'days');
  return Event.find({ status: 'active' }).then(events => {
    events.map(event => {
      if (today.format('LL') === moment(event.date_option.start_date).format('LL')) {
        event.users.map(userId => {
          return User.findOne(userId).then(user => {
            const message = `"${event.name}" is happening today!`;
            const payload = { event: event._id };
            user.apn_tokens.forEach(token => {
              sendPushNotification(token, message, payload);
            });
          });
        });
      }
    });
  });
};
exports.processNightNotifications = function() {
  const today = moment().startOf('day');
  const tommorow = today.clone().add(1, 'days');
  return Event.find({ status: 'active' }).then(events => {
    events.map(event => {
      if (tommorow.format('LL') === moment(event.date_option.start_date).format('LL')) {
        event.users.map(userId => {
          return User.findOne(userId).then(user => {
            const message = `"${event.name}" is happening tommorow`;
            const payload = { event: event._id };
            user.apn_tokens.forEach(token => {
              sendPushNotification(token, message, payload);
            });
          });
        });
      }
    });
  });
};
exports.addNewUser = function(codename, userId) {
  const handleNewUser = this.handleNewUser;
  const query = {};
  query['$addToSet'] = { users: [userId] };
  return Group.findOneAndUpdate({ codename }, query, { new: true }).then(group => {
    return handleNewUser(userId, group._id);
  });
};
exports.handleNewUser = function(userId, groupId) {
  return Event.find({ groups: groupId })
    .then(events => {
      const updatedEvents = events.map(event => {
        return Event.findOneAndUpdate(
          { _id: event._id },
          {
            $addToSet: { users: [userId] },
          },
        );
      });
      return Promise.all(updatedEvents);
    })
    .then(events => {
      const invitations = events.filter(event => event.status === 'pending').map(event => {
        return new Invitation({ user: userId, event: event._id }).save();
      });
      return Promise.all(invitations);
    });
};
exports.processInvites = function() {
  console.log('Processing Invites');
  // const nowOffset = moment().subtract(1, 'hours');
  const nowOffset = moment().add(20, 'hours');
  Event.find()
    .where('status')
    .equals('pending')
    .then(events => {
      events.map(event => {
        Invitation.find({ event: event._id }).then(invitations => {
          // Get all events expired or all invitations are answered
          const isReady = invitations.reduce((ready, invitation) => {
            const postExpiration = moment(event.expiration) < nowOffset;
            const postGracePeriod = moment(invitation.updated_at) < nowOffset;
            return ready && ((invitation.status !== 'idle' && postGracePeriod) || postExpiration);
          }, true);
          // if (true) {
          if (true) {
            // Check if all is accepted
            const allAccepted = invitations.some(i => {
              console.log(i.status)
              return i.status === 'yes'
            });
            console.log("ALL acceptend", allAccepted)
            const startDate = moment(event.date_option.start_date);
            const validDates = []
            for (let i = 0; i < event.date_option.duration; i++) {
              validDates.push(startDate.clone().add(i, 'days'));
            }
            // Unblackout?
            if (allAccepted) {
              Event.findOneAndUpdate(
                { _id: event._id },
                {
                  status: 'active',
                },
              ).then(event => {
                event.users.map(userId => {
                  return User.findOne(userId).then(user => {
                    const message = `Start planning! "${
                      event.name
                    }" is happening ${startDate.format('MMMM Do')}`;
                    const payload = { event: event._id };
                    user.apn_tokens.forEach(token => {
                      sendPushNotification(token, message, payload);
                    });
                  });
                });
              });
              Blackout.remove({ event: event._id, date: { $nin: validDates } }).exec();
            } else {
              Event.findOneAndUpdate({ _id: event._id }, { status: 'idle' }).exec();
              Blackout.remove({ event: event._id }).exec();
              Invitation.remove({ event: event._id }).exec();
            }
          }
        });
      });
    });
};

exports.handleInvites = function(baseDate, expiration = 3) {
  console.log('Handling Invites');
  const handleSingleEvent = this.handleSingleEvent;
  // 1. Find all events by date, weight, and status
  return Event.find()
    .where('status')
    .equals('idle')
    .then(events => {
      // Get dates based on notified_days_before
      // const validEvents = events.filter(event => {
      //   const date = moment(baseDate)
      //     .startOf('day')
      //     .add(event.notified_days_before + expiration, 'days');
      //   return event.options.start.includes(getDay(date));
      // });

      // 2. shuffle events
      const shuffledEvents = _.shuffle(events);
      let chainedPromises = Promise.resolve();

      shuffledEvents.map(event => {
        chainedPromises = chainedPromises.then(resp => {
          return handleSingleEvent(baseDate, event);
        });
      });
      return chainedPromises;
    });
};

const handleSingleEvent = function(baseDate, event, expiration = 1) {
  console.log('Handle Single Event', event.name);
  const date = moment(baseDate)
    .startOf('day')
    .add(event.notified_days_before + expiration, 'days');


  if (expiration === 5) return Promise.resolve();
  const validOptions = event.options.filter(option => option.start_day === getDay(date));
  if (validOptions.length === 0) return handleSingleEvent(baseDate, event, expiration + 1);

  const sampleOption = _.sample(validOptions);
  //3. get all blackouts from group of users & checked if first day is blacked out
  return isBlackedOutPromise(event.users, date, sampleOption.duration).then(isBlackedOut => {
    console.log(`${event.name} (${date}):`, isBlackedOut);
    if (!isBlackedOut) {
      // 4. Check if valid days are blacked out
      // const isBlackedOutPromises = event.valid_days.map(day => {
      //   const validDate = getNextDate(date, day);
      //   return isBlackedOutPromise(event.users, validDate, event.duration);
      // });

      // 5. Choose at most 3 random days
      // return Promise.all(isBlackedOutPromises).then(isBlackedOuts => {
      //   const availableDays = event.valid_days.filter((days, i) => !isBlackedOuts[i]);
      //   const availableDates = availableDays.map(day => getNextDate(date, day)).sort((left, right) => left.diff(right));
      //
      //   const randomDates = [availableDates[0], ..._.sampleSize(availableDates.slice(1), 1)];
      //
      //   // 6. Blackout the random days
      //   const blackouts = [];
      //   randomDates.forEach(date => {
      //     event.users.forEach(user => {
      //       for (let i = 0; i < event.duration; i++) {
      //         const newDate = date.add(i, 'days');
      //         const blackout = new Blackout({ date: newDate, user, event: event._id }).save();
      //         console.log(newDate);
      //         blackouts.push(blackout);
      //       }
      //     });
      //   });

      // console.log('-------------' + event.name, randomDates);

      // Single Date Option
      const blackouts = [];
      event.users.forEach(user => {
        for (let i = 0; i < sampleOption.duration; i++) {
          const blackoutDate = date.clone().add(i, 'days');
          const blackout = new Blackout({ date: blackoutDate, user, event: event._id }).save();
          blackouts.push(blackout);
        }
      });
      // Update event to pending
      Event.findOneAndUpdate(
        { _id: event._id },
        {
          status: 'pending',
          date_option: {
            start_date: date,
            duration: sampleOption.duration,
          },
          expiration: moment(baseDate)
            .startOf('day')
            .add(expiration, 'days'),
        },
      ).exec();

      // 7. Send out invitations
      event.users.map(userId => {
        new Invitation({ user: userId, event: event._id }).save().then(invitation => {
          return User.findOne(userId).then(user => {
            const message = `${event.name}.`;
            const payload = { event: event._id, invitation };
            user.apn_tokens.forEach(token => {
              console.log(message);
              sendPushNotification(token, message, payload);
            });
          });
        });
      });

      return Promise.all(blackouts);
      // });
    }
    return handleSingleEvent(baseDate, event, expiration + 1);
  });
};
exports.handleSingleEvent = handleSingleEvent;

function getNextDate(date, day) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const nDay = days.indexOf(day);
  if (moment(date).isoWeekday() <= nDay)
    return moment(date)
      .isoWeekday(nDay)
      .startOf('day');
  return moment(date)
    .add(1, 'weeks')
    .isoWeekday(nDay)
    .startOf('day');
}

function getDay(date) {
  const days = [null, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  return days[moment(date).isoWeekday()];
}

function isBlackedOutPromise(users, date, length) {
  const start = moment(date).startOf('day');
  const end = moment(date)
    .add(length - 1, 'days')
    .endOf('day');
  return Blackout.find()
    .where('user')
    .in(users)
    .where('date')
    .gte(start)
    .lte(end)
    .then(blackouts => {
      return blackouts.length > 0;
    });
}

function sendPushNotification(token, message, payload) {
  if (!Expo.isExpoPushToken(token)) {
    cons.error(`Push token ${pushToken} is not a valid Expo push token`);
    return;
  }
  const messges = [
    {
      to: token,
      sound: 'default',
      body: message,
      data: payload,
    },
  ];
  let chunks = expo.chunkPushNotifications(messages);
  (async () => {
    // Send the chunks to the Expo push notification service. There are
    // different strategies you could use. A simple one is to send one chunk at a
    // time, which nicely spreads the load out over time:
    for (let chunk of chunks) {
      try {
        let receipts = await expo.sendPushNotificationsAsync(chunk);
        console.log(receipts);
      } catch (error) {
        console.error(error);
      }
    }
  })();
}
exports.sendPushNotification = sendPushNotification;
