import React from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Exponent, { Constants, Permissions, Notifications } from 'exponent';

import DrawerLayout from 'react-native-drawer-layout';

import Button from './Button';
import DataStore from './DataStore';
import padNumber from './padNumber';
import todayAtMidnight from './todayAtMidnight';
import range from './range';

const DEFAULT_WORK_DURATION = 0.16667;
const DEFAULT_BREAK_DURATION = 0.16667;
const ONE_SECOND = 1000;
const TOMATO = '🍅';

class PomodoroApp extends React.Component {
  state = {
    workDuration: DEFAULT_WORK_DURATION,
    breakDuration: DEFAULT_BREAK_DURATION,
  };

  async componentDidMount() {
    let result = await Permissions.askAsync(Permissions.NOTIFICATIONS);

    if (Constants.isDevice && result.status !== 'granted') {
      alert(
        'You should enable notifications for this app otherwise you will not know when your timers expire!'
      );
      return;
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <DrawerLayout
          ref={view => {
            this._drawerLayout = view;
          }}
          drawerWidth={Dimensions.get('window').width - 30}
          renderNavigationView={this._renderMenu.bind(this)}>

          <CounterScreen {...this.state} />

          {this._renderMenuButton()}
        </DrawerLayout>
        <StatusBar barStyle="light-content" />
      </View>
    );
  }

  _renderMenuButton() {
    return (
      <TouchableOpacity
        hitSlop={{ top: 15, left: 15, right: 15, bottom: 15 }}
        onPress={() => {
          this._drawerLayout.openDrawer();
        }}
        style={styles.menuButtonContainer}>
        <Image
          style={styles.menuButton}
          source={{
            uri: 'https://s3.amazonaws.com/pomodoro-exp/menu-button.png',
          }}
        />
      </TouchableOpacity>
    );
  }

  _renderMenu() {
    return (
      <View style={{ backgroundColor: '#F9F9F9', flex: 1 }}>
        <View style={styles.menuHeader}>
          <Image
            resizeMode="cover"
            style={styles.menuHeaderBackground}
            source={{ uri: 'https://s3.amazonaws.com/pomodoro-exp/patch.jpg' }}
          />
          <View style={styles.menuHeaderOverlay} />

          <Text style={styles.menuHeaderText}>
            Pomodoro!
          </Text>
        </View>

        <View style={styles.menuOptions}>
          {this._renderOptions({
            title: 'Work',
            options: [5, 10, 15, 20],
            stateKey: 'workDuration',
          })}

          {this._renderOptions({
            title: 'Break',
            options: [1, 2.5, 5, 7.5],
            stateKey: 'breakDuration',
          })}
        </View>
      </View>
    );
  }

  _renderOptions({ title, options, stateKey }) {
    let optionElements = options.map(option => {
      let isSelected = this.state[stateKey] === option;

      return (
        <TouchableWithoutFeedback
          key={stateKey + option.toString()}
          onPress={() => this.setState(state => {
            state[stateKey] = option;
            return state;
          })}>
          <View
            style={[
              styles.optionButton,
              isSelected && styles.optionButtonSelected,
            ]}>
            <Text
              style={[
                styles.optionText,
                isSelected && styles.optionTextSelected,
              ]}>
              {option} min.
            </Text>
          </View>
        </TouchableWithoutFeedback>
      );
    });

    return (
      <View style={styles.optionsContainer}>
        <View style={styles.optionsTitle}>
          <Text style={styles.optionsTitleText}>
            {title}
          </Text>
        </View>
        <View style={styles.optionContainer}>
          {optionElements}
        </View>
      </View>
    );
  }
}

class CounterScreen extends React.Component {
  state = {
    backgroundColor: new Animated.Value(0),
    countdownState: 'idle',
    lastTick: null,
    endTime: null,
  };

  componentDidMount() {
    this._fetchCompletedCount();
  }

  async _pomodoroDidComplete() {
    await DataStore.incrementHarvest(todayAtMidnight());
    this._fetchCompletedCount();
  }

  render() {
    let { currentScreen } = this.state;
    let backgroundColor = this.state.backgroundColor.interpolate({
      inputRange: [0, 1, 2],
      outputRange: ['#000', '#CA4343', '#3268A6'],
    });

    return (
      <Animated.View style={[styles.container, { backgroundColor }]}>
        <View style={styles.contentContainer}>
          {this._renderTimeRemaining()}
        </View>
        {this._renderButtons()}
        <View style={styles.completedContainer}>
          <Text style={styles.completedText}>
            {this._renderTodaysCount()}
          </Text>
        </View>
      </Animated.View>
    );
  }

  _renderTimeRemaining() {
    let { endTime, lastTick } = this.state;
    let minutesRemaining;
    let secondsRemaining;

    if (endTime && lastTick) {
      minutesRemaining = Math.floor((endTime - lastTick) / 1000 / 60);
      secondsRemaining = Math.round(
        (endTime - lastTick) / 1000 - minutesRemaining * 60
      );
    } else if (this.state.countdownState === 'idle' && !endTime && !lastTick) {
      minutesRemaining = Math.floor(this.props.workDuration);
      secondsRemaining = Math.round(
        (this.props.workDuration - minutesRemaining) * 60
      );
    } else {
      console.log({ error: true, endTime, lastTick });
    }

    return (
      <Text style={styles.countdown}>
        {`${padNumber(minutesRemaining, 2)}:${padNumber(secondsRemaining, 2)}`}
      </Text>
    );
  }

  async _fetchCompletedCount() {
    let completedToday = await DataStore.harvestCountForDate(todayAtMidnight());
    this.setState({ completedToday });
  }

  _renderTodaysCount() {
    let { completedToday } = this.state;
    return range(completedToday).map((_, i) => <Text key={i}>{TOMATO}</Text>);
  }

  _renderButtons() {
    let { countdownState } = this.state;

    if (countdownState === 'idle') {
      return (
        <View style={styles.buttonContainer}>
          <Button
            onPress={() => {
              this._startTimer();
            }}>
            Start
          </Button>
        </View>
      );
    } else if (countdownState === 'active') {
      return (
        <View style={styles.buttonContainer}>
          <Button
            onPress={() => {
              this._pauseTimer();
            }}>
            Pause
          </Button>
          <Button
            onPress={() => {
              this._stopTimer(true);
            }}>
            Stop
          </Button>
        </View>
      );
    } else if (countdownState === 'paused') {
      return (
        <View style={styles.buttonContainer}>
          <Button
            onPress={() => {
              this._startTimer();
            }}>
            Start
          </Button>
          <Button
            onPress={() => {
              this._stopTimer(true);
            }}>
            Stop
          </Button>
        </View>
      );
    } else if (countdownState === 'break') {
      return (
        <View style={styles.buttonContainer}>
          <Button
            onPress={() => {
              this._startTimer();
            }}>
            Skip break
          </Button>
        </View>
      );
    }
  }

  _pauseTimer() {
    this.setState({ countdownState: 'paused' }, () => {
      Animated.spring(this.state.backgroundColor, { toValue: 0.5 }).start();

      clearInterval(this._timer);
      this._timer = null;

      if (this._notificationId) {
        Notifications.cancelScheduledNotificationAsync(this._notificationId);
      }
    });
  }

  _stopTimer(cancelNotification = false) {
    let { workDuration } = this.props;

    this.setState(
      { countdownState: 'idle', lastTick: null, endTime: null },
      () => {
        Animated.spring(this.state.backgroundColor, { toValue: 0 }).start();
        clearInterval(this._timer);
        this._timer = null;

        if (cancelNotification && this._notificationId) {
          Notifications.cancelScheduledNotificationAsync(this._notificationId);
          this._notificationId = null;
        }
      }
    );
  }

  _startTimer() {
    let { workDuration } = this.props;
    clearInterval(this._timer);

    let currentTime = new Date().getTime();
    let endTime;

    if (
      this.state.countdownState === 'paused' &&
      this.state.lastTick &&
      this.state.endTime
    ) {
      let timeIdle = currentTime - this.state.lastTick;
      endTime = this.state.endTime + timeIdle;
    } else {
      endTime = currentTime + workDuration * 60 * 1000;
    }

    this.setState(
      { countdownState: 'active', endTime, lastTick: currentTime },
      async () => {
        Animated.spring(this.state.backgroundColor, { toValue: 1 }).start();

        // Schedule notification
        this._notificationId = await Notifications.scheduleLocalNotificationAsync(
          {
            title: 'Pomdoro complete!',
            body: 'Break time...',
            ios: {
              sound: true,
            },
            android: {
              vibrate: true,
            },
          },
          {
            time: endTime,
          }
        );

        // Start ticker
        this._timer = setInterval(
          () => {
            let lastTick = new Date().getTime();
            if (lastTick > endTime) {
              this._pomodoroDidComplete();
              this._startBreak();
            } else {
              this.setState({ lastTick });
            }
          },
          ONE_SECOND
        );
      }
    );
  }

  _startBreak() {
    let { breakDuration } = this.props;
    clearInterval(this._timer);

    let currentTime = new Date().getTime();
    let endTime = currentTime + breakDuration * 60 * 1000;

    this.setState(
      { countdownState: 'break', endTime, lastTick: currentTime },
      async () => {
        Animated.spring(this.state.backgroundColor, { toValue: 2 }).start();

        // Schedule notification
        this._notificationId = await Notifications.scheduleLocalNotificationAsync(
          {
            title: 'Break is over!',
            body: 'Ready to start another Pomodoro?',
            ios: {
              sound: true,
            },
            android: {
              vibrate: true,
            },
          },
          {
            time: endTime,
          }
        );

        // Start ticker
        this._timer = setInterval(
          () => {
            let lastTick = new Date().getTime();
            if (lastTick > endTime) {
              this._startTimer();
            } else {
              this.setState({ lastTick });
            }
          },
          ONE_SECOND
        );
      }
    );
  }
}

const styles = StyleSheet.create({
  buttonContainer: {
    paddingTop: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
    flexDirection: 'row',
    flex: 0.5,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  completedContainer: {
    flex: 1,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  completedText: {
    fontSize: 30,
  },
  countdown: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 70,
  },
  subtitle: {
    color: '#fff',
    opacity: 0.75,
    fontSize: 25,
  },
  menuHeader: {
    height: 150,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 50,
  },
  menuHeaderBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  menuHeaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  menuHeaderText: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: 'transparent',
  },
  menuOptions: {
    backgroundColor: '#fff',
    paddingBottom: 0,
  },
  menuFooter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 15,
  },
  menuFooterImage: {
    width: 150,
    height: 25,
  },
  menuButtonContainer: {
    position: 'absolute',
    top: 45,
    left: 15,
  },
  menuButton: {
    width: 25.5,
    height: 17.5,
  },
  optionsContainer: {
    paddingTop: 12,
    paddingBottom: 5,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  optionsTitle: {
    paddingLeft: 15,
    paddingBottom: 12,
    paddingTop: 0,
  },
  optionsTitleText: {
    fontSize: 19,
    fontWeight: '300',
  },
  optionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    paddingTop: 0,
  },
  optionButton: {
    padding: 10,
    borderRadius: 3,
    backgroundColor: '#eee',
  },
  optionButtonSelected: {
    backgroundColor: '#D03838',
  },
  optionText: {
    color: '#888',
    fontSize: Dimensions.get('window').width > 320 ? 14 : 12,
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

Exponent.registerRootComponent(PomodoroApp);
