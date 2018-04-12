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

const options = {
  token: {
    key: __dirname + '/AuthKey_PFGVSWDYQ6.p8',
    keyId: 'PFGVSWDYQ6',
    teamId: 'Z2MXLM39UM',
  },
  production: false,
};
const apnProvider = new apn.Provider(options);

exports.initCronJobs = function() {
  const processInvites = this.processInvites;
  const handleInvites = this.handleInvites;
  console.log('Initializing cron jobs...');
  const handleInvitesJob = new CronJob(
    '00 30 11 * * 0-6',
    function() {
      console.log(moment());
      handleInvites(moment());
    },
    function() {
      /* This function is executed when the job stops */
    },
    true /* Start the job right now */,
  );

  const processInvitesJob = new CronJob(
    '0 0 */4 * * *',
    function() {
      console.log(moment());
      processInvites();
    },
    function() {
      /* This function is executed when the job stops */
    },
    true /* Start the job right now */,
  );
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
          if (isReady) {
            // Get Counter for all date options
            const datesAcceptedCount = invitations.reduce((dates_accepted_count, invitation) => {
              for (let i = 0; i < invitation.dates_accepted.length; i++) {
                const date = moment(invitation.dates_accepted[i]).toISOString();
                dates_accepted_count[date] = dates_accepted_count[date] ? dates_accepted_count[date] + 1 : 1;
              }
              return dates_accepted_count;
            }, {});
            console.log(event.name, datesAcceptedCount);
            // console.log('number of users', invitations.length);

            // Check if counters meet threshold
            const dates_options = Object.keys(datesAcceptedCount)
              // .filter(date => datesAcceptedCount[date] === 1) // Test purposes only
              .filter(date => datesAcceptedCount[date] === event.users.length)
              .sort((left, right) => left < right);

            // console.log('dates options', dates_options);
            // Unblackout?
            // If threshold is met:
            if (dates_options.length > 0) {
              const moment_date = moment(_.sample(dates_options));
              Event.findOneAndUpdate(
                { _id: event._id },
                {
                  status: 'active',
                  date_confirmed: moment(dates_options[0]),
                },
              ).then(event => {
                event.users.map(userId => {
                  return User.findOne(userId).then(user => {
                    const message = `Start planning! "${event.name}" is happening ${moment_date.format('MMMM Do')}`;
                    const payload = { event: event._id };
                    user.apn_tokens.forEach(token => {
                      sendPushNotification(token, message, payload);
                    });
                  });
                });
              });
              Blackout.remove({ event: event._id, date: { $ne: moment_date } }).exec();
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
  // 1. Find all events by date, weight, and status
  return Event.find()
    .where('status')
    .equals('idle')
    .then(events => {
      // Get dates based on notified_days_before
      const validEvents = events.filter(event => {
        const date = moment(baseDate)
          .startOf('day')
          .add(event.notified_days_before + expiration, 'days');
        return event.valid_days.includes(getDay(date));
      });

      // 2. shuffle events
      // console.log("Valid Events", validEvents);
      const shuffledEvents = _.shuffle(validEvents);
      let chainedPromises = Promise.resolve();

      shuffledEvents.map(event => {
        const date = moment(baseDate)
          .startOf('day')
          .add(event.notified_days_before + expiration, 'days');

        chainedPromises = chainedPromises
          .then(resp => {
            //3. get all blackouts from group of users & checked if first day is blacked out
            return isBlackedOutPromise(event.users, date, event.duration);
          })
          .then(isBlackedOut => {
            console.log(`${event.name} (${date}):`, isBlackedOut);
            if (!isBlackedOut) {
              // 4. Check if valid days are blacked out
              const isBlackedOutPromises = event.valid_days.map(day => {
                const validDate = getNextDate(date, day);
                return isBlackedOutPromise(event.users, validDate, event.duration);
              });

              // 5. Choose at most 3 random days
              return Promise.all(isBlackedOutPromises).then(isBlackedOuts => {
                const availableDays = event.valid_days.filter((days, i) => !isBlackedOuts[i]);
                const availableDates = availableDays.map(day => getNextDate(date, day)).sort((left, right) => left.diff(right));

                const randomDates = [availableDates[0], ..._.sampleSize(availableDates.slice(1), 1)];

                // 6. Blackout the random days
                const blackouts = [];
                randomDates.forEach(date => {
                  event.users.forEach(user => {
                    for (let i = 0; i < event.duration; i++) {
                      const newDate = date.add(i, 'days');
                      const blackout = new Blackout({ date: newDate, user, event: event._id }).save();
                      console.log(newDate);
                      blackouts.push(blackout);
                    }
                  });
                });

                console.log('-------------' + event.name, randomDates);
                // Update event to pending
                Event.findOneAndUpdate(
                  { _id: event._id },
                  {
                    status: 'pending',
                    dates_options: randomDates,
                    expiration: moment(baseDate)
                      .startOf('day')
                      .add(expiration, 'days'),
                  },
                ).exec();

                // 7. Send out invitations
                event.users.map(userId => {
                  new Invitation({ user: userId, event: event._id }).save().then(invitation => {
                    return User.findOne(userId).then(user => {
                      const message = `You have been invited to ${event.name}.`;
                      const payload = { event: event._id, invitation };
                      user.apn_tokens.forEach(token => {
                        console.log(message);
                        sendPushNotification(token, message, payload);
                      });
                    });
                  });
                });

                return Promise.all(blackouts);
              });
            }
            return Promise.resolve();
          });
      });
      return chainedPromises;
    });
};

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
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
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
  const note = new apn.Notification();
  note.badge = 1;
  note.sound = 'ping.aiff';
  note.alert = message;
  note.payload = payload;
  note.topic = 'org.reactjs.native.jonwu.Popcrew';
  apnProvider.send(note, token).then(result => {
    console.log(JSON.stringify(result));
    // see documentation for an explanation of result
  });
}
